@echo off
chcp 65001 >nul
echo ========================================
echo 项目文件清理脚本
echo ========================================
echo.
echo 此脚本将清理以下内容：
echo 1. 开发文档和需求文档（.md, .txt）
echo 2. 测试文件（test_*.js, .py）
echo 3. 测试数据（.xlsx, .json）
echo 4. 临时文件（nul）
echo 5. 文档文件夹（条款及费率文件/, 费率规则解析文件/）
echo 6. Server 测试脚本
echo 7. Client 测试页面
echo.
echo 重要文件将被保留：
echo - README.md
echo - .gitignore
echo - 所有源代码
echo - 保险条款 PDF 文件
echo.
echo ========================================
echo.

PAUSE
echo.

:: 创建备份文件夹
echo [1/6] 创建备份文件夹...
if not exist "docs_backup" mkdir docs_backup
if not exist "docs_backup\条款及费率文件" mkdir "docs_backup\条款及费率文件"
if not exist "docs_backup\费率规则解析文件" mkdir "docs_backup\费率规则解析文件"
echo ✓ 备份文件夹创建完成
echo.

:: 备份开发文档
echo [2/6] 备份开发文档...
xcopy "*.md" "docs_backup\" /Y /Q 2>nul
xcopy "*.txt" "docs_backup\" /Y /Q 2>nul
echo ✓ 开发文档备份完成
echo.

:: 备份文档文件夹
echo [3/6] 备份文档文件夹...
xcopy "条款及费率文件" "docs_backup\条款及费率文件\" /E /I /Y /Q 2>nul
xcopy "费率规则解析文件" "docs_backup\费率规则解析文件\" /E /I /Y /Q 2>nul
echo ✓ 文档文件夹备份完成
echo.

:: 删除文件
echo [4/6] 删除开发文档和测试文件...

:: 删除测试文件
echo   - 删除测试文件...
del /q "test_match.js" 2>nul
del /q "frontend_tests.py" 2>nul
del /q "excel_structure.json" 2>nul
del /q "nul" 2>nul

:: 删除开发文档（保留 README.md）
echo   - 删除开发文档...
del /q "AI提示词模型优化问题修复说明.md" 2>nul
del /q "PDF智能提取优化实施说明.md" 2>nul
del /q "PDF智能提取优化方案.md" 2>nul
del /q "UI重设计需求.txt" 2>nul
del /q "公司业务分类AI智能匹配实施说明.md" 2>nul
del /q "公司业务分类自动匹配方案.md" 2>nul
del /q "合同解析到报价映射功能实施完成.md" 2>nul
del /q "合同解析到报价映射功能方案.md" 2>nul
del /q "启动说明.md" 2>nul
del /q "建工意外险保单管理文件.txt" 2>nul
del /q "开发需求表：智能报价系统.md" 2>nul
del /q "历史数据.xlsx" 2>nul
del /q "历史数据导入模板 .xlsx" 2>nul
del /q "历史数据统计模块需求.txt" 2>nul
del /q "前端UI优化问题.txt" 2>nul
del /q "施工合同解析字段补充说明.md" 2>nul
del /q "施工合同解析字段配置说明.md" 2>nul
del /q "条款上下文下载计划.md" 2>nul
del /q "同步解析到报价信息转换功能完成.md" 2>nul
del /q "外部数据导入功能说明.md" 2>nul
del /q "外部导入费用缴费统计系统.md" 2>nul
del /q "修复上传个人信息组件（User Profile）的 UI 布局与交互功能.txt" 2>nul
del /q "智能分析推送方案.md" 2>nul
del /q "智能报价费率计算规则.md" 2>nul
del /q "智能助手使用说明.md" 2>nul
del /q "用户反馈历史数据进行优化问题的.txt" 2>nul
del /q "用户使用问题记录.md" 2>nul
del /q "用户端上传需补充医疗费实施.txt" 2>nul

echo ✓ 文件删除完成
echo.

:: 删除文件夹
echo [5/6] 删除文档文件夹...
if exist "条款及费率文件" rmdir /s /q "条款及费率文件"
if exist "费率规则解析文件" rmdir /s /q "费率规则解析文件"
echo ✓ 文档文件夹删除完成
echo.

:: 删除 server 测试文件
echo   - 删除 server 测试文件...
if exist "server\check-business-classifications.js" del /q "server\check-business-classifications.js"
if exist "server\check-business-classifications2.js" del /q "server\check-business-classifications2.js"
if exist "server\check-tables.js" del /q "server\check-tables.js"
if exist "server\database.db" del /q "server\database.db"
if exist "server\nul" del /q "server\nul"
if exist "server\scripts" rmdir /s /q "server\scripts"

:: 删除 client 测试文件
echo   - 删除 client 测试文件...
if exist "client\public\test-api.html" del /q "client\public\test-api.html"

echo ✓ Server 和 Client 测试文件删除完成
echo.

:: 更新 .gitignore
echo [6/6] 更新 .gitignore...
echo. >> .gitignore
echo # 开发文档和需求文档 >> .gitignore
echo *.md >> .gitignore
echo !README.md >> .gitignore
echo. >> .gitignore
echo # 测试文件 >> .gitignore
echo test_*.js >> .gitignore
echo test_*.py >> .gitignore
echo frontend_tests.py >> .gitignore
echo. >> .gitignore
echo # 测试数据 >> .gitignore
echo *.xlsx >> .gitignore
echo excel_structure.json >> .gitignore
echo. >> .gitignore
echo # 临时文件 >> .gitignore
echo nul >> .gitignore
echo. >> .gitignore
echo # Server 测试脚本 >> .gitignore
echo server/check-*.js >> .gitignore
echo server/scripts/ >> .gitignore
echo server/database.db >> .gitignore
echo. >> .gitignore
echo # Client 测试文件 >> .gitignore
echo client/public/test-api.html >> .gitignore
echo. >> .gitignore
echo # 文档文件夹 >> .gitignore
echo 条款及费率文件/ >> .gitignore
echo 费率规则解析文件/ >> .gitignore
echo ✓ .gitignore 更新完成
echo.

echo ========================================
echo 清理完成！
echo ========================================
echo.
echo 已删除文件和文件夹：
echo   - 开发文档（.md, .txt）
echo   - 测试文件（test_*.js, .py）
echo   - 测试数据（.xlsx）
echo   - 文档文件夹
echo   - Server/Client 测试文件
echo.
echo 备份位置：docs_backup\
echo.
echo 下一步操作：
echo 1. 检查备份文件夹确认文件已备份
echo 2. 测试应用是否正常运行
echo 3. 提交 Git 更改：
echo    git add .
echo    git commit -m "chore: 清理项目结构，移除开发文档和测试文件"
echo.
echo ========================================
PAUSE
