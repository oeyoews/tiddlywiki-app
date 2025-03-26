#!/bin/bash

repo="oeyoews/tiddlywiki-app"
api_url="https://api.github.com/repos/$repo/releases/latest"

# 获取最新的版本号，并去掉开头的 'v'
latest_version=$(curl -s "$api_url" | grep '"tag_name":' | sed 's/.*"tag_name": "\(v.*\)".*/\1/' | sed 's/^v//')

# 检查是否成功获取版本号
if [ -z "$latest_version" ]; then
    echo "获取最新版本失败"
    exit 1
fi

# 打印最新版本号
echo "最新版本号: $latest_version"

# 更新 PKGBUILD 文件中的 pkgver
sed -i "s/pkgver=[^ ]*/pkgver=$latest_version/" PKGBUILD

echo "PKGBUILD 已更新为最新版本 $latest_version"

echo "begin build tiddlywiki-app package"

makepkg -si ## please make sure that fakeroot is installed
