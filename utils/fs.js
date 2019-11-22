const fs = require("fs-extra");
const path = require("path");
async function readDir(dirPath, fullPath = false) {
  if (!fs.existsSync(dirPath)) {
    return Promise.resolve([]);
  }
  const children = await fs.readdir(dirPath);
  return children.map(childName => {
    return fullPath ? path.resolve(dirPath, childName) : childName;
  });
}

function isDir(targetPath) {
  const stat = fs.statSync(targetPath);
  return stat.isDirectory();
}

function isFile(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return false;
  }
  const stat = fs.statSync(targetPath);
  return stat.isFile();
}

async function readFile(filePath) {
  return await fs.readFile(filePath, "utf-8");
}

function getFilename(filePath, ext) {
  return path.basename(filePath, ext);
  // return (String(path).match(/[\\\/](\w+)\.[^\\/]+$/) || [])[1];
}

function writeFile(filePath, content) {
  fs.ensureFileSync(filePath);
  return fs.writeFile(filePath, content);
}

function writeJSON(filePath, object) {
  fs.ensureFileSync(filePath);
  return fs.writeJSON(filePath, object, { spaces: 2 });
}

function removeFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.removeSync(filePath);
  }
}

async function removeFileAsync(filePath) {
  if (fs.existsSync(filePath)) {
    await fs.remove(filePath);
  }
}

async function isChild(parentPath, targetPath, targetDir = false) {
  if (!fs.existsSync(parentPath) || !isDir(parentPath)) {
    return false;
  }
  if (!targetPath.startsWith(parentPath)) {
    return false;
  }
  const targetRelativePath = targetPath
    .replace(parentPath, "")
    .replace(/^[/\\]/, "");
  const children = await readDir(parentPath);
  return !!children.find(t => t === targetRelativePath);
}

function exists(targetPath) {
  return fs.existsSync(targetPath);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`src: ${src} 不存在`);
  }
  fs.ensureDirSync(src);
  fs.ensureDirSync(dest);
  return fs.copy(src, dest);
}

function copyFile(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`src: ${src} 不存在`);
  }
  fs.ensureFileSync(src);
  fs.ensureFileSync(dest);
  return fs.copy(src, dest);
}

function emptyDir(dir) {
  fs.ensureDirSync(dir);
  return fs.emptyDir(dir);
}

module.exports = {
  readDir,
  isDir,
  isFile,
  readFile,
  writeJSON,
  writeFile,
  removeFile,
  removeFileAsync,
  getFilename,
  isChild,
  exists,
  copyDir,
  copyFile,
  emptyDir
};
