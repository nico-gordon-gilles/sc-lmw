# Write the Windows version resource PyInstaller embeds in Starfix.exe.
# The number comes from companion/VERSION, so Explorer shows that version.

from pathlib import Path

here = Path(__file__).resolve().parent
parts = here.joinpath("VERSION").read_text(encoding="utf-8").strip().split(".")
nums = tuple(int(part) for part in parts[:3])
if len(nums) != 3:
    raise SystemExit("companion/VERSION must look like 1.2.3")
vers = nums + (0,)
label = "%d.%d.%d" % nums
text = """# UTF-8
VSVersionInfo(
  ffi=FixedFileInfo(
    filevers=%s,
    prodvers=%s,
    mask=0x3f,
    flags=0x0,
    OS=0x40004,
    fileType=0x1,
    subtype=0x0,
    date=(0, 0)
  ),
  kids=[
    StringFileInfo([
      StringTable(
        '040904B0',
        [
          StringStruct('CompanyName', 'SC LMW'),
          StringStruct('FileDescription', 'Starfix'),
          StringStruct('FileVersion', '%s'),
          StringStruct('InternalName', 'Starfix'),
          StringStruct('OriginalFilename', 'Starfix.exe'),
          StringStruct('ProductName', 'Starfix'),
          StringStruct('ProductVersion', '%s')
        ]
      )
    ]),
    VarFileInfo([VarStruct('Translation', [1033, 1200])])
  ]
)
""" % (vers, vers, label, label)
here.joinpath("file_version.txt").write_text(text, encoding="utf-8")
print(label)
