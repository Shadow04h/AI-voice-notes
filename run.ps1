$nodeBin = 'D:\nodejs\node-v24.19.0-win-x64'

if (-not (Test-Path -LiteralPath "$nodeBin\npm.cmd")) {
  throw "找不到 npm：$nodeBin。请检查 Node.js 的解压目录。"
}

$env:Path = "$nodeBin;$env:Path"
& "$nodeBin\npm.cmd" run android
