#!/usr/bin/env python3
"""Tiny adb driver used to capture the Android screenshots.

  droid.py tap "Sign in"          tap the first element whose text/content-desc contains it
  droid.py type "hello"           type into the focused field
  droid.py shot path.png          screenshot (status bar in demo mode)
  droid.py texts                  list visible texts (to find what to tap)
  droid.py wait "Home" [secs]     wait until a text shows up
  droid.py demo                   clean status bar: 9:41, full battery and signal
"""
import os, re, subprocess, sys, time
import xml.etree.ElementTree as ET

ADB = os.path.expanduser('~/Library/Android/sdk/platform-tools/adb')


def adb(*args, **kw):
    return subprocess.run([ADB, *args], check=True, capture_output=True, **kw).stdout


def nodes():
    adb('shell', 'uiautomator', 'dump', '/sdcard/ui.xml')
    root = ET.fromstring(adb('shell', 'cat', '/sdcard/ui.xml'))
    for n in root.iter('node'):
        label = (n.get('text') or '') + ' | ' + (n.get('content-desc') or '')
        b = list(map(int, re.findall(r'\d+', n.get('bounds'))))
        yield label, b


def find(needle, nth=0):
    hits = [b for label, b in nodes() if needle.lower() in label.lower()]
    return hits[nth] if len(hits) > nth else None


def main():
    cmd, args = sys.argv[1], sys.argv[2:]
    if cmd == 'tap':
        if re.fullmatch(r'\d+,\d+', args[0]):
            x, y = args[0].split(',')
        else:
            b = find(args[0], int(args[1]) if len(args) > 1 else 0)
            if not b:
                sys.exit(f'not found: {args[0]}')
            x, y = (b[0] + b[2]) // 2, (b[1] + b[3]) // 2
        adb('shell', 'input', 'tap', str(x), str(y))
    elif cmd == 'type':
        adb('shell', 'input', 'text', args[0].replace(' ', '%s'))
    elif cmd == 'key':
        adb('shell', 'input', 'keyevent', args[0])
    elif cmd == 'swipe':  # swipe up by default: scroll down
        adb('shell', 'input', 'swipe', '640', args[0] if args else '2000', '640', args[1] if len(args) > 1 else '900', '400')
    elif cmd == 'shot':
        with open(args[0], 'wb') as f:
            f.write(adb('exec-out', 'screencap', '-p'))
    elif cmd == 'texts':
        for label, b in nodes():
            if label.strip(' |'):
                print(label, b)
    elif cmd == 'wait':
        end = time.time() + (float(args[1]) if len(args) > 1 else 30)
        while time.time() < end:
            if find(args[0]):
                return
            time.sleep(1)
        sys.exit(f'timed out waiting for: {args[0]}')
    elif cmd == 'demo':
        adb('shell', 'settings', 'put', 'global', 'sysui_demo_allowed', '1')
        for extra in (['-e', 'command', 'enter'],
                      ['-e', 'command', 'clock', '-e', 'hhmm', '0941'],
                      ['-e', 'command', 'battery', '-e', 'level', '100', '-e', 'plugged', 'false'],
                      ['-e', 'command', 'network', '-e', 'wifi', 'show', '-e', 'level', '4', '-e', 'mobile', 'show', '-e', 'level', '4', '-e', 'datatype', 'none'],
                      ['-e', 'command', 'notifications', '-e', 'visible', 'false']):
            adb('shell', 'am', 'broadcast', '-a', 'com.android.systemui.demo', *extra)


if __name__ == '__main__':
    main()
