# Linux Installation Guide

## Problem: libcronet.so not found

On some Linux systems, you may encounter this error:

```
ImportError: libcronet.144.0.7506.0.so: cannot open shared object file: No such file or directory
```

This happens because the system can't find the Cronet shared library that's bundled with the Python package.

## Solutions

### Solution 1: Set LD_LIBRARY_PATH (Recommended for Development)

Find where cycronet is installed and add it to your library path:

```bash
# Find the installation path
python -c "import cycronet; import os; print(os.path.dirname(cycronet.__file__))"

# Set LD_LIBRARY_PATH (replace with your actual path)
export LD_LIBRARY_PATH=/home/baize/miniconda3/envs/spider/lib/python3.11/site-packages/cycronet:$LD_LIBRARY_PATH

# Run your script
python main.py
```

To make this permanent, add it to your `~/.bashrc` or `~/.bash_profile`:

```bash
echo 'export LD_LIBRARY_PATH=/path/to/cycronet:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc
```

### Solution 2: Use a Wrapper Script (Recommended for Production)

Create a wrapper script that sets the library path automatically:

```bash
#!/bin/bash
# run_with_cycronet.sh

# Get cycronet installation path
CYCRONET_PATH=$(python -c "import cycronet; import os; print(os.path.dirname(cycronet.__file__))" 2>/dev/null)

if [ -z "$CYCRONET_PATH" ]; then
    echo "Error: cycronet not found"
    exit 1
fi

# Set library path and run
export LD_LIBRARY_PATH="$CYCRONET_PATH:$LD_LIBRARY_PATH"
exec python "$@"
```

Make it executable and use it:

```bash
chmod +x run_with_cycronet.sh
./run_with_cycronet.sh main.py
```

### Solution 3: Copy Library to System Path (Requires Root)

```bash
# Find the library
CYCRONET_PATH=$(python -c "import cycronet; import os; print(os.path.dirname(cycronet.__file__))")

# Copy to system library directory
sudo cp $CYCRONET_PATH/libcronet.*.so /usr/local/lib/
sudo ldconfig
```

### Solution 4: Use patchelf (Advanced)

Install patchelf and modify the RPATH of the extension:

```bash
# Install patchelf
sudo apt-get install patchelf  # Debian/Ubuntu
# or
sudo yum install patchelf      # CentOS/RHEL

# Find the extension
CYCRONET_PATH=$(python -c "import cycronet; import os; print(os.path.dirname(cycronet.__file__))")

# Patch the extension
patchelf --set-rpath '$ORIGIN' $CYCRONET_PATH/cronet_cloak*.so
```

## Verification

After applying any solution, verify it works:

```python
import cycronet

# Test basic functionality
response = cycronet.get("https://httpbin.org/get", verify=False)
print(f"Status: {response.status_code}")
print("Success!")
```

## Troubleshooting

### Check if library exists

```bash
python -c "import cycronet; import os; import glob; print(glob.glob(os.path.join(os.path.dirname(cycronet.__file__), 'libcronet*.so')))"
```

### Check library dependencies

```bash
CYCRONET_PATH=$(python -c "import cycronet; import os; print(os.path.dirname(cycronet.__file__))")
ldd $CYCRONET_PATH/libcronet.*.so
```

### Check if LD_LIBRARY_PATH is set

```bash
echo $LD_LIBRARY_PATH
```

## For Package Maintainers

If you're building wheels for distribution, consider using `auditwheel` to bundle dependencies:

```bash
pip install auditwheel
auditwheel repair dist/cycronet-*.whl
```

This will create a manylinux wheel with all dependencies bundled.
