# APK 签名配置说明

## 问题：签名不一致

每次 GitHub Actions 构建使用临时 debug 密钥，导致无法直接覆盖安装。

## 解决方案

### 方法一：卸载后安装（临时方案）

卸载旧版本 → 安装新版本

**缺点：** 会丢失数据，需提前备份

---

### 方法二：使用固定签名（推荐）

#### 步骤 1：生成签名密钥

在安装了 Java 的电脑上执行：

```bash
cd android/app

# 生成 keystore
keytool -genkey -v \
  -keystore tangka-keystore.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias tangka-key \
  -storepass 你的密码 \
  -keypass 你的密码 \
  -dname "CN=Tangka Practice, OU=Tangka, O=Tangka, L=Beijing, ST=Beijing, C=CN"
```

**参数说明：**
- `-keystore`: 密钥库文件名
- `-alias`: 密钥别名
- `-storepass`: 密钥库密码
- `-keypass`: 密钥密码
- `-validity`: 有效期（天）

#### 步骤 2：转换为 Base64

```bash
# macOS/Linux
base64 -i tangka-keystore.jks -o keystore.base64

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("tangka-keystore.jks")) | Out-File -Encoding ASCII keystore.base64
```

#### 步骤 3：添加到 GitHub Secrets

访问：`https://github.com/你的用户名/tangka-practice-tracker/settings/secrets/actions`

添加以下 Secrets：

| Secret 名称 | 值 |
|------------|-----|
| `KEYSTORE_BASE64` | keystore.base64 文件的内容 |
| `KEYSTORE_PASSWORD` | 你设置的密钥库密码 |
| `KEY_ALIAS` | `tangka-key` |
| `KEY_PASSWORD` | 你设置的密钥密码 |

#### 步骤 4：触发新构建

推送代码或手动触发 Actions，将使用固定签名构建。

---

### 方法三：本地构建（最灵活）

在自己的电脑上构建，使用固定签名：

```bash
# 1. 安装依赖
npm install

# 2. 构建 Web
npm run build

# 3. 同步到 Android
npx cap sync

# 4. 打开 Android Studio
cd android
./gradlew assembleRelease

# 或使用命令行签名
cd app/build/outputs/apk/release
jarsigner -keystore ../../../../tangka-keystore.jks \
  -storepass 你的密码 \
  app-release-unsigned.apk \
  tangka-key

# 对齐优化
zipalign -v 4 app-release-unsigned.apk app-release.apk
```

---

## 安全提示

⚠️ **永远不要将 keystore 文件提交到 Git！**

keystore 文件已添加到 `.gitignore`：
```
android/app/*.jks
android/app/*.keystore
android/signing/*.jks
android/signing/*.base64
```

---

## 常见问题

### Q: 忘记 keystore 密码怎么办？
**A:** 无法恢复，必须重新生成。所有用户都需要卸载重装。

### Q: 可以修改签名吗？
**A:** 不能。一旦发布，必须使用相同签名更新。

### Q: debug 和 release 签名有什么区别？
**A:** 
- Debug：自动生成的临时签名，仅开发使用
- Release：固定的正式发布签名

---

## 推荐流程

对于个人使用：
1. 生成一个固定的 release 签名
2. 保存好 keystore 文件和密码
3. 使用固定签名构建所有版本
4. 可以无缝覆盖更新
