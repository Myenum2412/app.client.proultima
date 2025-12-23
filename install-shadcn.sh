#!/bin/bash

echo "======================================"
echo " Initializing shadcn/ui"
echo "======================================"

npx shadcn@latest init -y

echo "======================================"
echo " Installing shadcn/ui components"
echo "======================================"

components=(
  accordion
  alert
  alert-dialog
  aspect-ratio
  avatar
  badge
  breadcrumb
  button
  calendar
  card
  checkbox
  collapsible
  command
  context-menu
  dialog
  drawer
  dropdown-menu
  hover-card
  input
  input-otp
  label
  menubar
  navigation-menu
  pagination
  popover
  progress
  radio-group
  resizable
  scroll-area
  select
  separator
  sheet
  sidebar
  skeleton
  slider
  sonner
  switch
  table
  tabs
  textarea
  toast
  toggle
  toggle-group
  tooltip
)

for component in "${components[@]}"
do
  echo "Installing $component..."
  npx shadcn@latest add "$component"
done

echo "======================================"
echo " Installing required dependencies"
echo "======================================"

npm install lucide-react \
@tanstack/react-table \
react-hook-form \
zod \
@hookform/resolvers \
recharts \
embla-carousel-react

echo "======================================"
echo " shadcn/ui setup completed successfully"
echo "======================================"
