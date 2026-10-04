#!/usr/bin/env python3
import os
import sys
import time
import subprocess
import urllib.request
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHECKER_SCRIPT = os.path.join(BASE_DIR, "checker.js")

WHITE = "\033[97m"
GRAY = "\033[90m"
BOLD = "\033[1m"
RESET = "\033[0m"

BANNER = r'''
  _____                           _         _____       _                 
 / ____|                         (_)       / ____|     (_)                
| |  __  ___ _ __  ___ _ __ _  ___  ___   | (___  _ __  _ _ __   ___ _ __ 
| | |_ |/ _ \ '_ \/ _ \ '__| |/ __|/ __|   \___ \| '_ \| | '_ \ / _ \ '__|
| |__| |  __/ | | |  __/ |  | | (__\__ \   ____) | | | | | |_) |  __/ |   
 \_____|\___|_| |_|\___|_|  |_|\___|___/  |_____/|_| |_|_| .__/ \___|_|   
                                                         | |              
                                                         |_|              
'''

def clear_screen():
    os.system("cls" if os.name == "nt" else "clear")

def draw_header():
    clear_screen()
    print(BOLD + WHITE + BANNER + RESET)
    print(f"{GRAY}{'═' * 70}{RESET}")
    print(f" {WHITE}{BOLD}GENERIC SNIPER{RESET} {GRAY}|{RESET} {WHITE}Terminal Control Panel{RESET} {GRAY}|{RESET} {WHITE}Status: Online{RESET}")
    print(f"{GRAY}{'═' * 70}{RESET}\n")

def draw_panel(title, lines):
    width = 66
    print(f"{GRAY}┌─ {WHITE}{BOLD}[ {title} ]{RESET}{GRAY} {'─' * (width - len(title) - 7)}┐{RESET}")
    for line in lines:
        clean_len = len(line.replace(BOLD, "").replace(RESET, "").replace(WHITE, "").replace(GRAY, ""))
        padding = " " * max(0, width - clean_len - 2)
        print(f"{GRAY}│{RESET} {line}{padding}{GRAY}│{RESET}")
    print(f"{GRAY}└{'─' * width}┘{RESET}")

def test_webhook(url):
    if not url:
        return False, "URL not defined"
    msg = {
        "content": "```text\n╔══════════════════════════╗\n║      WEBHOOK TEST        ║\n╠══════════════════════════╣\n║  STATUS   : SUCCESS      ║\n╚══════════════════════════╝\n  generic sniper\n```"
    }
    req = urllib.request.Request(url, data=json.dumps(msg).encode("utf-8"), headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            return True, f"HTTP {res.status}"
    except Exception as e:
        return False, str(e)

def main():
    webhook_url = os.environ.get("DISCORD_WEBHOOK_URL", "")

    while True:
        draw_header()
        wh_display = f"{WHITE}Configured{RESET}" if webhook_url else f"{GRAY}Not configured{RESET}"
        
        status_info = [
            f"{GRAY}Application Status :{RESET} {WHITE}Active & Ready{RESET}",
            f"{GRAY}Webhook Channel    :{RESET} {wh_display}",
            f"{GRAY}Execution Engine   :{RESET} {WHITE}Node.js{RESET}",
        ]
        draw_panel("SYSTEM & STATUS", status_info)
        print()

        menu_options = [
            f"{BOLD}{WHITE}[1]{RESET} {GRAY}Start Verification Engine{RESET}",
            f"{BOLD}{WHITE}[2]{RESET} {GRAY}Configure Discord Webhook{RESET}",
            f"{BOLD}{WHITE}[3]{RESET} {GRAY}Send Test Webhook Message{RESET}",
            f"{BOLD}{WHITE}[0]{RESET} {GRAY}Exit{RESET}"
        ]
        draw_panel("MAIN MENU", menu_options)
        print()

        try:
            choice = input(f"{BOLD}{WHITE}generic-sniper{RESET} {GRAY}»{RESET} ").strip()
        except (KeyboardInterrupt, EOFError):
            print(f"\n\n{GRAY}Terminating Generic Sniper.{RESET}\n")
            sys.exit(0)

        if choice == "1":
            clear_screen()
            print(f"{GRAY}{'═' * 70}{RESET}")
            print(f" {BOLD}{WHITE}STARTING VERIFIER...{RESET}")
            print(f"{GRAY}{'═' * 70}{RESET}\n")
            env = os.environ.copy()
            if webhook_url:
                env["DISCORD_WEBHOOK_URL"] = webhook_url
            try:
                subprocess.run(["node", CHECKER_SCRIPT], env=env)
            except Exception as e:
                print(f"{WHITE}Failed to execute Node.js: {e}{RESET}")
            input(f"\n{GRAY}Press Enter to return to menu...{RESET}")

        elif choice == "2":
            clear_screen()
            print(f"{GRAY}{'═' * 70}{RESET}")
            print(f" {BOLD}{WHITE}DISCORD WEBHOOK CONFIGURATION{RESET}")
            print(f"{GRAY}{'═' * 70}{RESET}\n")
            if webhook_url:
                print(f"{GRAY}Current webhook: {WHITE}{webhook_url[:40]}...{RESET}\n")
            novo = input(f"{GRAY}Insert new Webhook URL (or press Enter to clear):{RESET} ").strip()
            webhook_url = novo
            print(f"\n{WHITE}Webhook saved!{RESET}" if webhook_url else f"\n{GRAY}Webhook cleared.{RESET}")
            time.sleep(1.2)

        elif choice == "3":
            clear_screen()
            print(f"{GRAY}{'═' * 70}{RESET}")
            print(f" {BOLD}{WHITE}WEBHOOK DISPATCH TEST{RESET}")
            print(f"{GRAY}{'═' * 70}{RESET}\n")
            if not webhook_url:
                print(f"{WHITE}No webhook configured. Use option 2 first.{RESET}")
            else:
                print(f"{GRAY}Sending test message...{RESET}")
                ok, res = test_webhook(webhook_url)
                if ok:
                    print(f"\n{WHITE}Message delivered to Discord! ({res}){RESET}")
                else:
                    print(f"\n{WHITE}Failed to send: {res}{RESET}")
            input(f"\n{GRAY}Press Enter to return...{RESET}")

        elif choice == "0":
            print(f"\n{GRAY}Terminating panel...{RESET}\n")
            break
        else:
            print(f"{WHITE}Invalid option.{RESET}")
            time.sleep(0.5)

if __name__ == "__main__":
    main()
