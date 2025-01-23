const archiver = require("archiver");
const crypto = require("crypto");
const streamBuffers = require("stream-buffers");

const compactFile = async (fileBuffer, filename) => {
  try {
    // Garantir que fileBuffer é um Buffer
    if (!(fileBuffer instanceof Buffer)) {
      fileBuffer = Buffer.from(fileBuffer);
    }

    const archive = archiver("zip", {
      zlib: { level: 9 }, // Define o nível de compressão.
    });

    const writableStreamBuffer = new streamBuffers.WritableStreamBuffer();

    archive.pipe(writableStreamBuffer);
    archive.append(fileBuffer, { name: filename });
    await archive.finalize();

    const archiveBuffer = writableStreamBuffer.getContents();
    const base64File = archiveBuffer.toString("base64");
    const md5 = crypto.createHash("md5").update(base64File).digest("hex");

    return { archiveBuffer, base64File, md5 };
  } catch (error) {
    throw new Error("Erro ao compactar arquivo");
  }
};

const streamToBuffer = (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
};

module.exports = { compactFile };
