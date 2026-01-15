#!/usr/bin/env python3
"""
Comprehensive gradient removal script for Nexa project
Replaces all gradient patterns with solid colors + glow effects
"""

import re
import os
from pathlib import Path

# Define replacement patterns
REPLACEMENTS = [
    # Button gradients -> solid with border and glow
    (r'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
     'bg-blue-600 hover:bg-blue-700 border-2 border-blue-500 hover:border-blue-400 shadow-glow-blue hover:shadow-glow-blue-lg'),
    
    (r'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
     'bg-emerald-600 hover:bg-emerald-700 border-2 border-emerald-500 hover:border-emerald-400 shadow-glow-green'),
    
    # Background gradients -> solid
    (r'bg-gradient-to-br from-blue-900/20 to-blue-900/5',
     'bg-blue-900/10'),
    
    (r'bg-gradient-to-br from-purple-900/20 to-purple-900/5',
     'bg-purple-900/10'),
    
    (r'bg-gradient-to-br from-green-900/20 to-green-900/5',
     'bg-green-900/10'),
    
    (r'bg-gradient-to-br from-blue-900/20 to-purple-900/20',
     'bg-blue-900/15 border-2 border-blue-800/20'),
    
    (r'bg-gradient-to-br from-blue-500/20 to-purple-500/20',
     'bg-blue-500/20 border-2 border-blue-500/30 shadow-glow-blue'),
    
    (r'bg-gradient-to-br from-gray-900 to-gray-950',
     'bg-gray-900'),
    
    (r'bg-gradient-to-r from-gray-900 to-gray-800',
     'bg-gray-900'),
    
    # Progress bars -> solid with glow
    (r'bg-gradient-to-r from-purple-500 to-pink-500',
     'bg-purple-500 shadow-glow-purple'),
    
    (r'bg-gradient-to-r from-blue-500 to-purple-500',
     'bg-blue-500shadow-glow-blue'),
    
    (r'bg-gradient-to-r from-green-500 to-emerald-500',
     'bg-emerald-500 shadow-glow-green'),
    
    # Inline conditional gradients -> solid
    (r"'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'",
     "'bg-blue-600 hover:bg-blue-700 border-2 border-blue-500 hover:border-blue-400 shadow-glow-blue hover:shadow-glow-blue-lg'"),
    
    (r"'bg-gradient-to-r from-blue-600 to-purple-600'",
     "'bg-blue-600 border-2 border-blue-500 shadow-glow-blue'"),
    
    # Section backgrounds -> solid  
    (r'bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-pink-900/20',
     'bg-blue-950/20 border-t border-blue-900/20'),
    
    # Badge/pill gradients -> solid
    (r'bg-gradient-to-r from-blue-500/20 to-purple-500/20',
     'bg-blue-500/20 border-2 border-blue-500/40 shadow-glow-blue'),
    
    # Text gradients -> solid with glow
    (r'bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent',
     'text-blue-400 text-glow-blue'),
    
    (r'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent',
     'text-blue-400 text-glow-blue'),
]

def remove_gradients_from_file(file_path):
    """Remove gradients from a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply all replacements
        for pattern, replacement in REPLACEMENTS:
            content = re.sub(pattern, replacement, content)
        
        # Only write if changes were made
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    frontend_dir = Path('/home/skywalker/Projects/prj/nexa/frontend')
    app_dir = frontend_dir / 'app'
    components_dir = frontend_dir / 'components'
    
    tsx_files = list(app_dir.rglob('*.tsx')) + list(components_dir.rglob('*.tsx'))
    
    modified_count = 0
    for tsx_file in tsx_files:
        if remove_gradients_from_file(tsx_file):
            modified_count += 1
            print(f"✓ Modified: {tsx_file.relative_to(frontend_dir)}")
    
    print(f"\n✅ Complete! Modified {modified_count} files")
    
    # Count remaining gradients
    import subprocess
    try:
        result = subprocess.run(
            ['grep', '-r', 'bg-gradient', str(app_dir), '--include=*.tsx'],
            capture_output=True,
            text=True
        )
        remaining = len(result.stdout.strip().split('\n')) if result.stdout.strip() else 0
        print(f"📊 Remaining gradient instances: {remaining}")
    except:
        pass

if __name__ == '__main__':
    main()
