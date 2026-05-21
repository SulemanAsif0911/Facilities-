const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { URL } = require("node:url");

const root = __dirname;
const lectures = JSON.parse(fs.readFileSync(path.join(root, "data", "lectures.json"), "utf8"));
const mediaById = new Map(lectures.map((lecture) => [lecture.id, lecture.videoPath]));

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function sendNotFound(response) {
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
}

function sendStatic(requestPath, response) {
  const cleanPath = requestPath === "/" ? "/index.html" : requestPath;
  const absolutePath = path.resolve(root, `.${decodeURIComponent(cleanPath)}`);

  if (!absolutePath.startsWith(root)) {
    sendNotFound(response);
    return;
  }

  fs.stat(absolutePath, (error, stats) => {
    if (error || !stats.isFile()) {
      sendNotFound(response);
      return;
    }

    const type = mimeTypes[path.extname(absolutePath).toLowerCase()] || "application/octet-stream";
    response.writeHead(200, {
      "Content-Type": type,
      "Content-Length": stats.size
    });
    fs.createReadStream(absolutePath).pipe(response);
  });
}

function sendMedia(id, request, response) {
  const videoPath = mediaById.get(id);
  if (!videoPath) {
    sendNotFound(response);
    return;
  }

  fs.stat(videoPath, (error, stats) => {
    if (error || !stats.isFile()) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Video source missing");
      return;
    }

    const range = request.headers.range;
    if (!range) {
      response.writeHead(200, {
        "Content-Type": "video/mp4",
        "Content-Length": stats.size,
        "Accept-Ranges": "bytes"
      });
      fs.createReadStream(videoPath).pipe(response);
      return;
    }

    const match = range.match(/bytes=(\d*)-(\d*)/);
    if (!match) {
      response.writeHead(416);
      response.end();
      return;
    }

    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Number(match[2]) : stats.size - 1;

    if (start >= stats.size || end >= stats.size || start > end) {
      response.writeHead(416, {
        "Content-Range": `bytes */${stats.size}`
      });
      response.end();
      return;
    }

    response.writeHead(206, {
      "Content-Type": "video/mp4",
      "Content-Length": end - start + 1,
      "Content-Range": `bytes ${start}-${end}/${stats.size}`,
      "Accept-Ranges": "bytes"
    });
    fs.createReadStream(videoPath, { start, end }).pipe(response);
  });
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, "http://localhost");
  if (url.pathname.startsWith("/media/")) {
    sendMedia(decodeURIComponent(url.pathname.slice("/media/".length)), request, response);
    return;
  }

  sendStatic(url.pathname, response);
});

function listen(port, attemptsLeft = 20) {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && attemptsLeft > 0) {
      listen(port + 1, attemptsLeft - 1);
      return;
    }
    throw error;
  });

  server.listen(port, "127.0.0.1", () => {
    const address = server.address();
    console.log(`Bayan ul Quran player running at http://127.0.0.1:${address.port}`);
  });
}

listen(Number(process.env.PORT) || 4173);
