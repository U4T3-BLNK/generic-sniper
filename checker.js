const readline = require("readline");

let DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";

const c = {
    white: "\x1b[97m",
    gray: "\x1b[90m",
    reset: "\x1b[0m",
    bold: "\x1b[1m"
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise(resolve => rl.question(question, resolve));
}

function formatDiscordMessage(username) {
    const userLine = "  USER     : @" + username;
    const innerWidth = Math.max(26, userLine.length + 2);
    const titlePadded = "USER DISCOVERED".padStart(Math.floor((innerWidth + 15) / 2)).padEnd(innerWidth);

    return "```text\n" +
    "╔" + "═".repeat(innerWidth) + "╗\n" +
    "║" + titlePadded + "║\n" +
    "╠" + "═".repeat(innerWidth) + "╣\n" +
    "║" + "  PLATFORM : guns.lol".padEnd(innerWidth) + "║\n" +
    "║" + userLine.padEnd(innerWidth) + "║\n" +
    "║" + "  STATUS   : AVAILABLE".padEnd(innerWidth) + "║\n" +
    "╚" + "═".repeat(innerWidth) + "╝\n" +
    "  generic sniper\n" +
    "```";
}

async function sendDiscordWebhook(username, webhookUrl) {
    if (!webhookUrl) return;
    try {
        const payload = { content: formatDiscordMessage(username) };
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (response.ok) {
            console.log("  " + c.white + "↳ Webhook alert sent successfully!" + c.reset);
        } else {
            console.error("  " + c.gray + "↳ Webhook error (HTTP " + response.status + ")" + c.reset);
        }
    } catch (err) {
        console.error("  " + c.gray + "↳ Webhook connection failed" + c.reset);
    }
}

let cookieJar = "";

async function getClearance() {
    try {
        const response = await fetch("https://guns.lol/api/auth/username/test/availability", {
            redirect: "manual",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
                "Accept": "*/*",
                "Referer": "https://guns.lol/register"
            }
        });
        const setCookie = response.headers.get("set-cookie");
        if (setCookie) cookieJar = setCookie.split(";")[0];
    } catch (e) {}
}

async function checkUsername(username, webhookUrl) {
    try {
        if (!cookieJar) await getClearance();

        const headers = {
            "Accept": "*/*",
            "Referer": "https://guns.lol/register",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "Priority": "u=4"
        };
        if (cookieJar) headers["Cookie"] = cookieJar;

        const url = "https://guns.lol/api/auth/username/" + encodeURIComponent(username) + "/availability";
        let response = await fetch(url, { headers, redirect: "manual" });

        if (response.status === 307) {
            const setCookie = response.headers.get("set-cookie");
            if (setCookie) {
                cookieJar = setCookie.split(";")[0];
                headers["Cookie"] = cookieJar;
            }
            response = await fetch(url, { headers });
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            throw new Error("Invalid API response (HTTP " + response.status + ")");
        }

        const data = await response.json();

        if (data.available === true) {
            console.log(c.white + "[+] Available: " + username + c.reset);
            await sendDiscordWebhook(username, webhookUrl);
        } else {
            console.log(c.gray + "[-] Taken: " + username + c.reset);
        }
    } catch (error) {
        console.error(c.gray + "[!] Error checking " + username + ": " + error.message + c.reset);
    }
}

async function main() {
    console.log("\n" + c.white + c.bold + "╔════════════════════════════════════════╗" + c.reset);
    console.log(c.white + c.bold + "║             GENERIC SNIPER             ║" + c.reset);
    console.log(c.white + c.bold + "╚════════════════════════════════════════╝" + c.reset + "\n");

    console.log(c.gray + "Select character type:" + c.reset);
    console.log(c.white + "[ 1 ]" + c.reset + c.gray + " Letters only (a-z, A-Z)" + c.reset);
    console.log(c.white + "[ 2 ]" + c.reset + c.gray + " Letters, numbers, underscores (a-z, A-Z, 0-9, _)" + c.reset);
    console.log(c.white + "[ 3 ]" + c.reset + c.gray + " Letters, numbers, underscores, hyphens (a-z, A-Z, 0-9, _, -)\n" + c.reset);

    let type, length, amount;

    while (true) {
        type = await ask(c.white + "» Character type (1, 2, 3): " + c.reset);
        if (["1", "2", "3"].includes(type.trim())) break;
    }

    while (true) {
        let lenInput = await ask(c.white + "» Username length (3-16): " + c.reset);
        length = Number(lenInput);
        if (Number.isInteger(length) && length >= 3 && length <= 16) break;
    }

    while (true) {
        let amtInput = await ask(c.white + "» Amount to check (1-999): " + c.reset);
        amount = Number(amtInput);
        if (Number.isInteger(amount) && amount >= 1 && amount <= 999) break;
    }

    let webhookUrl = DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
        console.log();
        const inputWebhook = await ask(c.gray + "» Discord Webhook URL (Enter to skip): " + c.reset);
        if (inputWebhook.trim()) webhookUrl = inputWebhook.trim();
    }

    rl.close();
    console.log("\n" + c.gray + "Starting verification of " + amount + " usernames..." + c.reset + "\n");

    let chars = "";
    if (type === "1") chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    else if (type === "2") chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";
    else if (type === "3") chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-";

    for (let i = 0; i < amount; i++) {
        let username = "";
        for (let j = 0; j < length; j++) {
            username += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        await checkUsername(username, webhookUrl);

        if (i < amount - 1) {
            await new Promise(resolve => setTimeout(resolve, 600)); 
        }
    }
}

main();
