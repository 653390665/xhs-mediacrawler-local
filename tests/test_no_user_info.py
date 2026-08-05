# -*- coding: utf-8 -*-
"""
教学版回归测试：确保爬取/存储链路不再持久化可定位真人的用户个人信息。

覆盖：
1. ORM 自省 —— database.models 中无禁用列、creator 档案表已删除、内容/评论表含 creator_hash。
2. 提取层 —— 用 mock API/HTML payload 喂各平台提取器，断言输出 dict 不含禁用字段、
   不含原始 user_id、昵称已脱敏且不等于原文。
3. 仓库 grep 断言 —— store/ 与 media_platform/ 不再把禁用字段作为存储 dict 的 key。
"""
import ast
import json
import pathlib
import re
import subprocess

import pytest

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONFIG_ENV_NAMES = (
    "XHS_COOKIES",
    "XHS_LOGIN_TYPE",
    "XHS_KEYWORDS",
    "XHS_CRAWLER_MAX_NOTES_COUNT",
    "XHS_ENABLE_GET_COMMENTS",
)

# 统一的禁用字段名(键)。昵称字段(nickname/user_nickname/screen_name/name/user_name)允许保留(值需脱敏)。
FORBIDDEN_KEYS = {
    "user_id", "sec_uid", "short_user_id", "user_unique_id", "user_signature",
    "avatar", "user_avatar", "face", "sign", "profile_url", "user_link",
    "url_token", "user_url_token", "ip_location", "ip_address", "gender", "sex",
    "up_id", "fan_id", "up_name", "fan_name", "up_avatar", "fan_avatar",
    "up_sign", "fan_sign", "mid", "author_id", "xsec_token", "cookie", "cookies",
}
NICK_KEYS = {"nickname", "user_nickname", "screen_name", "name", "user_name"}
MASK_RE = re.compile(r"^.?\*{1,4}.?$")


# ----------------------------- ORM 自省 -----------------------------

def test_orm_has_no_forbidden_columns():
    import database.models as m
    from sqlalchemy.orm import class_mapper
    tables = [c for c in dir(m) if c[0].isupper()
              and c not in ("Base", "Column", "Integer", "BigInteger", "String", "Text")]
    bad = []
    for t in tables:
        cols = {c.name for c in class_mapper(getattr(m, t)).columns}
        hit = cols & FORBIDDEN_KEYS
        if hit:
            bad.append((t, sorted(hit)))
    assert not bad, f"ORM 仍含禁用列: {bad}"


def test_creator_tables_removed():
    import database.models as m
    removed = {"XhsCreator", "DyCreator", "WeiboCreator", "TiebaCreator",
               "ZhihuCreator", "BilibiliUpInfo", "BilibiliContactInfo"}
    for t in removed:
        assert not hasattr(m, t), f"creator 档案表 {t} 仍存在"


def test_content_tables_have_creator_hash():
    import database.models as m
    from sqlalchemy.orm import class_mapper
    content_tables = ["XhsNote", "XhsNoteComment", "WeiboNote", "WeiboNoteComment",
                      "BilibiliVideo", "BilibiliVideoComment", "BilibiliUpDynamic",
                      "DouyinAweme", "DouyinAwemeComment", "KuaishouVideo",
                      "KuaishouVideoComment", "TiebaNote", "TiebaComment",
                      "ZhihuContent", "ZhihuComment"]
    for t in content_tables:
        cols = {c.name for c in class_mapper(getattr(m, t)).columns}
        assert "creator_hash" in cols, f"{t} 缺少 creator_hash 列"


# ----------------------------- 提取层 mock -----------------------------

def _check_no_forbidden_keys(d: dict, label: str):
    keys = set(d.keys())
    hit = keys & FORBIDDEN_KEYS
    assert not hit, f"[{label}] 输出仍含禁用字段键: {hit}"


def _check_nickname_masked(d: dict, raw: str, label: str):
    nick_keys = set(d.keys()) & NICK_KEYS
    assert nick_keys, f"[{label}] 未保留任何昵称字段(应保留并脱敏)"
    for k in nick_keys:
        val = d[k]
        if val in ("", None):
            continue
        assert val != raw, f"[{label}] {k} 未脱敏，仍为原文: {val}"
        assert MASK_RE.match(val) or "*" in val, f"[{label}] {k} 未脱敏: {val}"


def test_mask_and_hash_tools():
    from tools.user_hash import anonymize_user_id, mask_nickname
    h = anonymize_user_id("12345")
    assert h and h != "12345" and re.fullmatch(r"[0-9a-f]{16}", h)
    assert anonymize_user_id(None) == "" and anonymize_user_id("") == ""
    # 昵称脱敏：首尾留1字、中间星号，且不等于原文
    assert mask_nickname("张三丰") != "张三丰"
    assert "*" in mask_nickname("张三丰")
    assert mask_nickname(None) == ""
    assert mask_nickname("a") == "*"


def test_xhs_note_extraction_masks_user_info():
    import asyncio
    import store.xhs as xs
    note_item = {
        "note_id": "abc",
        "type": "normal",
        "title": "t",
        "desc": "d",
        "time": 1,
        "last_update_time": 0,
        "user": {"user_id": "u123", "nickname": "小红同学", "avatar": "http://x/a.jpg"},
        "ip_location": "上海",
        "interact_info": {"liked_count": "1", "collected_count": "0",
                          "comment_count": "0", "share_count": "0"},
        "image_list": [], "tag_list": [], "xsec_token": "tok",
    }
    captured = {}

    class FakeStore:
        async def store_content(self, content_item):
            captured.update(content_item)

    orig = xs.XhsStoreFactory.create_store
    xs.XhsStoreFactory.create_store = staticmethod(lambda: FakeStore())
    try:
        asyncio.run(xs.update_xhs_note(note_item))
    finally:
        xs.XhsStoreFactory.create_store = orig
    _check_no_forbidden_keys(captured, "xhs_note")
    assert captured.get("creator_hash") != "u123"
    assert captured["note_url"] == "https://www.xiaohongshu.com/explore/abc"
    assert "tok" not in json.dumps(captured)
    _check_nickname_masked(captured, "小红同学", "xhs_note")


def test_tieba_note_extraction_masks_user_info():
    from media_platform.tieba.help import TieBaExtractor
    api_data = {
        "thread": {"id": 1, "title": "tt", "reply_num": 5},
        "first_floor": {"tid": 1, "author_id": 9, "time": 1700000000, "content": "c"},
        "forum": {"name": "test", "id": 1},
        "page": {"total_page": 1},
        "user_list": [{"id": 9, "name_show": "贴吧老哥", "name": "lg", "portrait": "p", "ip_address": "北京"}],
    }
    note = TieBaExtractor().extract_note_detail_from_api(api_data)
    d = note.model_dump()
    _check_no_forbidden_keys(d, "tieba_note")
    assert d.get("creator_hash")  # user_link 已转哈希
    _check_nickname_masked(d, "贴吧老哥", "tieba_note")


def test_tieba_comment_extraction_masks_user_info():
    from media_platform.tieba.help import TieBaExtractor
    from model.m_baidu_tieba import TiebaNote
    api_data = {
        "forum": {"id": 1, "name": "test"},
        "post_list": [{"id": 7, "author_id": 9, "time": 1700000000, "content": "c", "sub_post_number": 0}],
        "user_list": [{"id": 9, "name_show": "评论员", "name": "py", "portrait": "p", "ip_address": "上海"}],
    }
    note_detail = TiebaNote(note_id="1", title="t", note_url="u", tieba_name="test", tieba_link="l")
    comments = TieBaExtractor().extract_tieba_note_parent_comments_from_api(api_data, note_detail)
    assert comments
    d = comments[0].model_dump()
    _check_no_forbidden_keys(d, "tieba_comment")
    _check_nickname_masked(d, "评论员", "tieba_comment")


def test_zhihu_comment_extraction_masks_user_info():
    from media_platform.zhihu.help import ZhihuExtractor
    from model.m_zhihu import ZhihuContent
    comments_raw = [{
        "type": "comment", "id": 1, "content": "c", "created_time": 1700000000,
        "like_count": 1, "dislike_count": 0, "child_comment_count": 0,
        "author": {"id": "z9", "name": "知乎答主", "url_token": "tok", "avatar_url": "http://x/a.jpg"},
        "comment_tag": [{"type": "ip_info", "text": "广东"}],
    }]
    page_content = ZhihuContent(content_id="c1", content_type="answer")
    comments = ZhihuExtractor().extract_comments(page_content, comments_raw)
    assert comments
    d = comments[0].model_dump() if hasattr(comments[0], "model_dump") else vars(comments[0])
    _check_no_forbidden_keys(d, "zhihu_comment")
    assert "creator_hash" in d and d["creator_hash"]
    _check_nickname_masked(d, "知乎答主", "zhihu_comment")


def test_bilibili_video_dict_masks_user_info():
    # 直接测 store/bilibili/__init__.py 的拍平逻辑(不触发网络)
    import asyncio
    from store.bilibili import update_bilibili_video
    video_item = {
        "View": {
            "aid": 100, "title": "t", "desc": "d", "pubdate": 1,
            "owner": {"mid": 777, "name": "UP主大人", "face": "http://x/a.jpg"},
            "stat": {"like": 1, "view": 2},
            "pic": "http://x/cover.jpg",
        }
    }
    # 拦截真实存储：替换工厂返回一个捕获 dict 的假 store
    captured = {}

    class FakeStore:
        async def store_content(self, content_item):
            captured.update(content_item)

    import store.bilibili as bs
    orig = bs.BiliStoreFactory.create_store
    bs.BiliStoreFactory.create_store = staticmethod(lambda: FakeStore())
    try:
        asyncio.get_event_loop().run_until_complete(update_bilibili_video(video_item)) \
            if False else asyncio.run(update_bilibili_video(video_item))
    finally:
        bs.BiliStoreFactory.create_store = orig
    _check_no_forbidden_keys(captured, "bili_video")
    assert captured.get("creator_hash") != 777
    _check_nickname_masked(captured, "UP主大人", "bili_video")


# ----------------------------- 仓库 grep 断言 -----------------------------

def test_store_no_forbidden_dict_keys():
    # store/ 下不得把禁用字段作为存储 dict 的 key("field": value 形式)
    out = subprocess.run(
        ["grep", "-rnE", '"(' + "|".join(FORBIDDEN_KEYS) + r')"\s*:', str(ROOT / "store")],
        capture_output=True, text=True,
    )
    # 允许的例外：Mongo store_creator 里的 query={"user_id": ...} 已全部改为 pass，应为空
    assert out.stdout.strip() == "", f"store/ 仍写入禁用字段键:\n{out.stdout}"


def test_store_no_creator_orm_imports():
    # 已删除的 creator ORM 表(XhsCreator/DyCreator/...)不得再从 database.models 导入。
    # 注意:model/m_*.py 里的同名 pydantic 类是内存类型，允许保留。
    out = subprocess.run(
        ["grep", "-rnE",
         r"from database\.models import.*(XhsCreator|DyCreator|WeiboCreator|TiebaCreator|ZhihuCreator|BilibiliUpInfo|BilibiliContactInfo)",
         str(ROOT / "store")],
        capture_output=True, text=True,
    )
    assert out.stdout.strip() == "", f"store/ 仍 import 已删除的 creator ORM 表:\n{out.stdout}"


def _load_base_config(tmp_path, monkeypatch, **environment):
    source = (ROOT / "config" / "base_config.py").read_text(encoding="utf-8")
    source = source.split("\nfrom .bilibili_config import *", 1)[0]
    fake_config = tmp_path / "config" / "base_config.py"
    fake_config.parent.mkdir(exist_ok=True)

    for name in CONFIG_ENV_NAMES:
        monkeypatch.delenv(name, raising=False)
    for name, value in environment.items():
        monkeypatch.setenv(name, value)
    namespace = {"__file__": str(fake_config)}
    exec(compile(source, str(fake_config), "exec"), namespace)
    return namespace


def test_crawler_config_uses_generic_defaults(tmp_path, monkeypatch):
    namespace = _load_base_config(tmp_path, monkeypatch)

    assert namespace["KEYWORDS"] == "编程副业,编程兼职"
    assert namespace["CRAWLER_MAX_NOTES_COUNT"] == 15
    assert namespace["ENABLE_GET_COMMENTS"] is True


def test_crawler_config_accepts_environment_overrides(tmp_path, monkeypatch):
    namespace = _load_base_config(
        tmp_path,
        monkeypatch,
        XHS_KEYWORDS="测试话题,通用对标",
        XHS_CRAWLER_MAX_NOTES_COUNT="42",
        XHS_ENABLE_GET_COMMENTS="false",
    )

    assert namespace["KEYWORDS"] == "测试话题,通用对标"
    assert namespace["CRAWLER_MAX_NOTES_COUNT"] == 42
    assert namespace["ENABLE_GET_COMMENTS"] is False


@pytest.mark.parametrize(
    ("name", "value", "message"),
    [
        ("XHS_CRAWLER_MAX_NOTES_COUNT", "0", "positive integer"),
        ("XHS_CRAWLER_MAX_NOTES_COUNT", "3.5", "positive integer"),
        ("XHS_ENABLE_GET_COMMENTS", "yes", "must be one of"),
    ],
)
def test_crawler_config_rejects_invalid_environment_values(
    tmp_path, monkeypatch, name, value, message
):
    with pytest.raises(ValueError, match=message):
        _load_base_config(tmp_path, monkeypatch, **{name: value})


def test_cookie_config_is_optional_and_environment_takes_priority(tmp_path, monkeypatch):
    namespace = _load_base_config(tmp_path, monkeypatch)
    assert namespace["COOKIES"] == ""
    assert namespace["LOGIN_TYPE"] == "qrcode"

    namespace = _load_base_config(
        tmp_path, monkeypatch, XHS_COOKIES="test-only-cookie"
    )
    assert namespace["COOKIES"] == "test-only-cookie"
    assert namespace["LOGIN_TYPE"] == "cookie"


def test_cookie_file_is_ignored_by_submodule():
    patterns = (ROOT / ".gitignore").read_text(encoding="utf-8").splitlines()
    assert "cookies.txt" in patterns


def test_xhs_logs_do_not_include_sensitive_payloads():
    files = [
        ROOT / "store" / "xhs" / "__init__.py",
        ROOT / "media_platform" / "xhs" / "core.py",
        ROOT / "media_platform" / "xhs" / "client.py",
    ]
    forbidden = ("author_id", "user_id", "xsec_token", "notes_res", "note_details", "creator_info")
    bad = []
    for path in files:
        source = path.read_text(encoding="utf-8")
        tree = ast.parse(source)
        for call in (node for node in ast.walk(tree) if isinstance(node, ast.Call)):
            snippet = ast.get_source_segment(source, call) or ""
            if ".logger." in snippet and any(name in snippet for name in forbidden):
                bad.append(f"{path.relative_to(ROOT)}:{call.lineno}")
    assert not bad, f"XHS 日志仍包含敏感载荷: {bad}"


def test_backfill_has_one_syntax_valid_sanitized_path():
    assert not (ROOT / "backfill_followers.py").exists()
    script = ROOT / "backfill_followers.mjs"
    source = script.read_text(encoding="utf-8")
    assert "creator_hash" in source
    assert "nickname" not in source
    assert "path.resolve(opts.input) === path.resolve(opts.output)" in source
    result = subprocess.run(
        ["node", "--check", str(script)], capture_output=True, text=True
    )
    assert result.returncode == 0, result.stderr


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
