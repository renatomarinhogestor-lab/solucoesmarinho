const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const OUTPUT = path.join(ROOT, "dist");

const GTM_ID = "GTM-TSG462G";

const GTM_HEAD = `
<!-- Google Tag Manager -->
<script>
(function(w,d,s,l,i){
  w[l]=w[l]||[];
  w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
  var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),
      dl=l!='dataLayer'?'&l='+l:'';
  j.async=true;
  j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
  f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');
</script>
<!-- End Google Tag Manager -->
`;

const GTM_BODY = `
<!-- Google Tag Manager (noscript) -->
<noscript>
  <iframe
    src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}"
    height="0"
    width="0"
    style="display:none;visibility:hidden">
  </iframe>
</noscript>
<!-- End Google Tag Manager (noscript) -->
`;

const IGNORE = new Set([
  ".git",
  ".github",
  "node_modules",
  "dist"
]);

function copyAndProcess(source, destination) {
  const stats = fs.statSync(source);

  if (stats.isDirectory()) {
    const folderName = path.basename(source);

    if (IGNORE.has(folderName)) {
      return;
    }

    fs.mkdirSync(destination, { recursive: true });

    for (const item of fs.readdirSync(source)) {
      copyAndProcess(
        path.join(source, item),
        path.join(destination, item)
      );
    }

    return;
  }

  if (path.basename(source) === "build.js") {
    return;
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });

  if (path.extname(source).toLowerCase() !== ".html") {
    fs.copyFileSync(source, destination);
    return;
  }

  let html = fs.readFileSync(source, "utf8");

  // Evita duplicar o GTM caso a página já tenha recebido a tag.
  if (!html.includes(GTM_ID)) {
    html = html.replace(
      /<head([^>]*)>/i,
      `<head$1>${GTM_HEAD}`
    );

    html = html.replace(
      /<body([^>]*)>/i,
      `<body$1>${GTM_BODY}`
    );
  }

  fs.writeFileSync(destination, html, "utf8");

  console.log(`GTM inserido: ${path.relative(ROOT, source)}`);
}

if (fs.existsSync(OUTPUT)) {
  fs.rmSync(OUTPUT, {
    recursive: true,
    force: true
  });
}

fs.mkdirSync(OUTPUT, { recursive: true });

for (const item of fs.readdirSync(ROOT)) {
  if (IGNORE.has(item) || item === "build.js") {
    continue;
  }

  copyAndProcess(
    path.join(ROOT, item),
    path.join(OUTPUT, item)
  );
}

console.log("");
console.log(`Build concluído com ${GTM_ID}.`);
console.log("Arquivos publicados em /dist");
