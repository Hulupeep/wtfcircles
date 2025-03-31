#!/bin/bash

# Prompt for Jira ticket and short title
read -p "Enter Jira ticket (e.g. WTF-2): " ticket
read -p "Enter short title (e.g. add-auth-flow): " short

# Sanitize branch name
branch=$(echo "${ticket}-${short}" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cs 'a-z0-9-_' '-')

# Create new branch
git checkout -b $branch

# Do your work...
echo "🛠️ You're now working in: $branch"
echo "Make your changes, then press enter to continue..."
read

# Add & commit
read -p "Enter commit message: " message
git add .
git commit -m "$ticket: $message"

# Push branch
git push -u origin $branch

# Open browser to GitHub PR page
repo=$(git config --get remote.origin.url | sed -e 's/.*github.com.//' -e 's/.git$//')
open_cmd="xdg-open" # macOS: use 'open'

$open_cmd "https://github.com/${repo}/pull/new/${branch}"
