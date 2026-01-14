#!/bin/bash
# Batch gradient removal script for Nexa project

cd /home/skywalker/Projects/prj/nexa/frontend

echo "Starting gradient removal..."

# Replace common gradient button patterns
find app -name "*.tsx" -type f -exec sed -i \
  's/bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700/bg-blue-600 hover:bg-blue-700 border-2 border-blue-500 hover:border-blue-400 shadow-glow-blue hover:shadow-glow-blue-lg/g' {} +

find app -name "*.tsx" -type f -exec sed -i \
  's/bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700/bg-emerald-600 hover:bg-emerald-700 border-2 border-emerald-500 hover:border-emerald-400 shadow-glow-green/g' {} +

# Replace gradient backgrounds  
find app -name "*.tsx" -type f -exec sed -i \
  's/bg-gradient-to-br from-blue-900\/20 to-blue-900\/5/bg-blue-900\/10/g' {} +

find app -name "*.tsx" -type f -exec sed -i \
  's/bg-gradient-to-br from-purple-900\/20 to-purple-900\/5/bg-purple-900\/10/g' {} +

find app -name "*.tsx" -type f -exec sed -i \
  's/bg-gradient-to-br from-blue-500\/20 to-purple-500\/20/bg-blue-500\/20 border-2 border-blue-500\/30 shadow-glow-blue/g' {} +

# Replace gradient progress bars
find app -name "*.tsx" -type f -exec sed -i \
  's/bg-gradient-to-r from-purple-500 to-pink-500/bg-purple-500 shadow-glow-purple/g' {} +

echo "Gradient removal complete!"
echo "Counting remaining gradients..."
grep -r "bg-gradient" app --include="*.tsx" | wc -l
