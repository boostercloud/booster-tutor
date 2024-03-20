# Booster Tutor

This is the official Booster Tutor VSCode extension for speeding up the learning process while using Booster thanks to the power of IA.

## Prerequisites

Before getting started, make sure you have the following prerequisites installed:

- Node.js (version v18 or higher)
- npm (version v10 or higher)
- pnpm (version v8 or higher)

To install Node.js and npm, you can visit the official Node.js website and follow the installation instructions for your operating system.

To install `pnpm`, you can run the following command:

    npm i -g pnpm

## Getting started

First clone the repository in your local machine, and get familiarized on the structure. You can find the different projects inside the apps directory.

Then navigate to each project and install the packages with the following command:

    pnpm i

## Troubleshooting

If you encounter any issues while setting up or using the Booster Tutor extension, here are some troubleshooting steps you can try:

1. **Ensure all prerequisites are installed**: Double-check that you have Node.js, npm, and pnpm installed at the required versions mentioned in the Prerequisites section.

2. **Upgrade icu4c library**: If you see the error message **"If Library not loaded: /usr/local/opt/icu4c/lib/libicui18n.69.dylib"** on MacOS, you can try running the following command to upgrade the icu4c library:

   ```bash
   brew upgrade icu4c
   ```

If none of the above steps resolve your issue, please consider reaching out to the project maintainers for further assistance.
