# server

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.2. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.


## minifying use 
```bash
bun build index.ts --minify
```
to save to a build file use 
```bash 
bun build index.ts --outdir=build --minify
```

argon2 is better than bcrypt