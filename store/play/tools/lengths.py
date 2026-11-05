"""Print the Play length of each listing block in store/play/listing.md."""
import re, sys, pathlib
text = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "store/play/listing.md").read_text()
limits = {"short": 80, "full": 4000}
for kind, lang, body in re.findall(r"<!-- (short|full):(\w+) -->\n(.*?)\n<!-- /\1:\2 -->", text, re.S):
    n = len(body.strip())
    print(f"{kind}:{lang} {n}/{limits[kind]} {'OK' if n <= limits[kind] else 'TOO LONG'}")
