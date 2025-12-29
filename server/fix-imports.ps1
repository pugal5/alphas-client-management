# Fix ES module imports to include .js extensions
$files = Get-ChildItem -Path src -Recurse -Filter *.ts

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Fix single quotes: from './path' -> from './path.js'
    $content = $content -replace "from '\./([^']+)'", "from './`$1.js'"
    $content = $content -replace "from '\.\./([^']+)'", "from '../`$1.js'"
    $content = $content -replace "from '\.\./\.\./([^']+)'", "from '../../`$1.js'"
    
    # Fix double quotes: from "./path" -> from "./path.js"
    $content = $content -replace 'from "\./([^"]+)"', 'from "./$1.js"'
    $content = $content -replace 'from "\.\./([^"]+)"', 'from "../$1.js"'
    $content = $content -replace 'from "\.\./\.\./([^"]+)"', 'from "../../$1.js"'
    
    # Skip if already has .js extension
    $content = $content -replace '\.js\.js', '.js'
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.FullName)"
    }
}

Write-Host "Done fixing imports!"

