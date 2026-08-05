/**
 * backfill_followers.mjs — 回填作者粉丝数
 * 用登录 profile 打开作者主页，等 JS 渲染后提取粉丝数。
 * 输入是限权的临时采集文件；输出只保留 creator_hash 和粉丝数。
 *
 * 用法:
 *   node backfill_followers.mjs --input <temporary-samples.json> --output <followers.json>
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { homedir } from "node:os";
import process from "node:process";
import puppeteer from "puppeteer-core";

const USER_DATA_DIR = path.join(homedir(), ".xhs-login-profile");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { input: null, output: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--input") opts.input = args[++i];
    else if (args[i] === "--output") opts.output = args[++i];
  }
  return opts;
}

function parseCount(raw) {
  if (!raw) return null;
  const s = String(raw).replace(/,/g, "").trim();
  const m = s.match(/^([\d.]+)\s*(万|w|k)?/i);
  if (!m) return null;
  const num = parseFloat(m[1]);
  if (m[2] && /万|w/i.test(m[2])) return Math.round(num * 10000);
  if (m[2] && /k/i.test(m[2])) return Math.round(num * 1000);
  return Math.round(num);
}

async function extractFans(page, authorId) {
  try {
    await page.goto(
      `https://www.xiaohongshu.com/user/profile/${authorId}`,
      { waitUntil: "domcontentloaded", timeout: 45000 }
    );
    await new Promise((r) => setTimeout(r, 5000));
    return await page.evaluate(() => {
      const text = document.body ? document.body.innerText : "";
      // 主页常见格式："粉丝 1.2万" 或 "粉丝\n12000"
      const match = text.match(/粉丝\s*([\d.,]+万?|\d[\d.,]*)/);
      if (!match) return null;
      return match[1];
    });
  } catch (_) {
    return null;
  }
}

async function main() {
  const opts = parseArgs();
  if (!opts.input || !opts.output) {
    throw new Error("用法: node backfill_followers.mjs --input <temporary-samples.json> --output <followers.json>");
  }
  if (path.resolve(opts.input) === path.resolve(opts.output)) {
    throw new Error("输出必须与含原始作者ID的临时输入分离");
  }
  if (process.platform !== "win32" && (fs.statSync(opts.input).mode & 0o077) !== 0) {
    throw new Error("临时输入权限过宽；请先执行 chmod 600 <input>");
  }

  const data = JSON.parse(fs.readFileSync(opts.input, "utf-8"));
  const authors = new Map();
  for (const item of data) {
    const aid = item.author_id;
    if (aid && !authors.has(aid)) {
      authors.set(aid, {
        creator_hash: crypto.createHash("sha256").update(String(aid)).digest("hex").slice(0, 16),
        follower_count: null,
      });
    }
  }
  const ids = [...authors.keys()];
  console.error(`[backfill] 待补粉丝数作者：${ids.length} 个`);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME,
    userDataDir: USER_DATA_DIR,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
  );
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  let ok = 0;
  for (const aid of ids) {
    const raw = await extractFans(page, aid);
    const fans = parseCount(raw);
    const author = authors.get(aid);
    author.follower_count = fans;
    if (fans !== null) {
      ok++;
      console.error(`  ✓ ${author.creator_hash}: ${fans}`);
    } else {
      console.error(`  ✗ ${author.creator_hash}: 未提取到`);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  await browser.close().catch(() => {});

  const followers = [...authors.values()];
  fs.writeFileSync(opts.output, JSON.stringify({ followers }, null, 2), {
    encoding: "utf-8",
    mode: 0o600,
  });
  if (process.platform !== "win32") fs.chmodSync(opts.output, 0o600);
  console.error(`[backfill] 成功 ${ok}/${ids.length}`);
  console.error(`[backfill] 已写入脱敏映射: ${opts.output}`);
}

main().catch((err) => {
  console.error("[backfill] 致命错误:", err.message);
  process.exit(1);
});
