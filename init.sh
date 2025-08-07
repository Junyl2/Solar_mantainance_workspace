#!/bin/bash

echo "git fetch --all 실행"
git fetch --all
echo ""

echo "git reset --hard origin/master 실행"
git reset --hard origin/master
echo ""

echo "git pull origin master 실행"
git pull origin master
echo ""
