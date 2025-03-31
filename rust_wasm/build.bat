@echo off
echo Building Dithering WebAssembly Module
echo ===================================

REM Check if Rust is installed
rustc --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Rust is not installed. Please install Rust from https://www.rust-lang.org/tools/install
    exit /b 1
)

REM Check if wasm-pack is installed
wasm-pack --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo wasm-pack is not installed. Installing now...
    cargo install wasm-pack
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install wasm-pack. Please install it manually.
        exit /b 1
    )
)

echo Building WebAssembly module...
wasm-pack build --target web

if %ERRORLEVEL% NEQ 0 (
    echo Build failed.
    exit /b 1
)

echo Build successful!

REM Create assets directory if it doesn't exist
mkdir ..\public\assets 2> nul
echo Copying files to public and src directories...

REM Copy the wasm file to the assets directory
copy /Y pkg\dithering_wasm_bg.wasm ..\public\assets\dithering_wasm.wasm

REM Copy the JS file to the wasm directory
copy /Y pkg\dithering_wasm.js ..\src\lib\wasm\

echo Done! WebAssembly module is ready to use. 