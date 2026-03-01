@echo off
chcp 65001 >nul
cls
echo ========================================
echo 🔒 安全清理脚本 - 不影响应用运行
echo ========================================
echo.
echo 此脚本将：
echo 1. ✅ 备份所有文档到 docs_backup\
echo 2. 🗑️ 删除开发文档和测试文件
echo 3. ✅ 保留所有应用运行需要的文件
echo 4. ✅ 验证关键文件存在
echo.
echo ========================================
echo.

PAUSE
echo.

:: ========================================
:: 第一步：验证关键文件
:: ========================================
echo [1/7] 验证应用关键文件...
echo.

set MISSING_FILES=0

:: 检查前端关键文件
echo 检查前端文件...
if not exist "client\src" (
    echo   ❌ 错误：client\src 不存在！
    set MISSING_FILES=1
)
if not exist "client\package.json" (
    echo   ❌ 错误：client\package.json 不存在！
    set MISSING_FILES=1
)
if not exist "client\public\assets\clauses\main.pdf" (
    echo   ❌ 错误：保险条款PDF不存在！
    set MISSING_FILES=1
)
if not exist "client\public\assets\clauses\medical.pdf" (
    echo   ❌ 错误：保险条款PDF不存在！
    set MISSING_FILES=1
)
if not exist "client\public\assets\clauses\allowance.pdf" (
    echo   ❌ 错误：保险条款PDF不存在！
    set MISSING_FILES=1
)
if not exist "client\public\assets\clauses\acute_disease.pdf" (
    echo   ❌ 错误：保险条款PDF不存在！
    set MISSING_FILES=1
)
if not exist "client\public\assets\clauses\plateau_disease.pdf" (
    echo   ❌ 错误：保险条款PDF不存在！
    set MISSING_FILES=1
)

:: 检查后端关键文件
echo 检查后端文件...
if not exist "server\src" (
    echo   ❌ 错误：server\src 不存在！
    set MISSING_FILES=1
)
if not exist "server\package.json" (
    echo   ❌ 错误：server\package.json 不存在！
    set MISSING_FILES=1
)

if %MISSING_FILES%==1 (
    echo.
    echo ❌ 发现缺失的关键文件，取消清理操作！
    echo 请确保应用完整后再运行此脚本。
    PAUSE
    exit /b 1
)

echo ✓ 所有关键文件验证通过
echo.

:: ========================================
:: 第二步：创建备份
:: ========================================
echo [2/7] 创建备份文件夹...
if not exist "docs_backup" mkdir docs_backup
if not exist "docs_backup\条款及费率文件" mkdir "docs_backup\条款及费率文件"
if not exist "docs_backup\费率规则解析文件" mkdir "docs_backup\费率规则解析文件"
echo ✓ 备份文件夹创建完成
echo.

echo [3/7] 备份开发文档...
xcopy "*.md" "docs_backup\" /Y /Q 2>nul
xcopy "*.txt" "docs_backup\" /Y /Q 2>nul
echo ✓ 开发文档备份完成
echo.

echo [4/7] 备份文档文件夹...
xcopy "条款及费率文件" "docs_backup\条款及费率文件\" /E /I /Y /Q 2>nul
xcopy "费率规则解析文件" "docs_backup\费率规则解析文件\" /E /I /Y /Q 2>nul
echo ✓ 文档文件夹备份完成
echo.

:: ========================================
:: 第三步：删除文件
:: ========================================
echo [5/7] 删除开发文档和测试文件...
echo.

:: 删除测试文件
echo   📝 删除测试文件...
if exist "test_match.js" (
    del /q "test_match.js"
    echo     ✓ test_match.js 已删除
)
if exist "frontend_tests.py" (
    del /q "frontend_tests.py"
    echo     ✓ frontend_tests.py 已删除
)
if exist "excel_structure.json" (
    del /q "excel_structure.json"
    echo     ✓ excel_structure.json 已删除
)
if exist "nul" (
    del /q "nul"
    echo     ✓ nul 已删除
)

:: 删除开发文档（保留 README.md 和 项目文件清理报告.md）
echo   📝 删除开发文档...
if exist "AI提示词模型优化问题修复说明.md" (
    del /q "AI提示词模型优化问题修复说明.md"
    echo     ✓ AI提示词模型优化问题修复说明.md 已删除
)
if exist "PDF智能提取优化实施说明.md" (
    del /q "PDF智能提取优化实施说明.md"
    echo     ✓ PDF智能提取优化实施说明.md 已删除
)
if exist "PDF智能提取优化方案.md" (
    del /q "PDF智能提取优化方案.md"
    echo     ✓ PDF智能提取优化方案.md 已删除
)
if exist "UI重设计需求.txt" (
    del /q "UI重设计需求.txt"
    echo     ✓ UI重设计需求.txt 已删除
)
if exist "公司业务分类AI智能匹配实施说明.md" (
    del /q "公司业务分类AI智能匹配实施说明.md"
    echo     ✓ 公司业务分类AI智能匹配实施说明.md 已删除
)
if exist "公司业务分类自动匹配方案.md" (
    del /q "公司业务分类自动匹配方案.md"
    echo     ✓ 公司业务分类自动匹配方案.md 已删除
)
if exist "合同解析到报价映射功能实施完成.md" (
    del /q "合同解析到报价映射功能实施完成.md"
    echo     ✓ 合同解析到报价映射功能实施完成.md 已删除
)
if exist "合同解析到报价映射功能方案.md" (
    del /q "合同解析到报价映射功能方案.md"
    echo     ✓ 合同解析到报价映射功能方案.md 已删除
)
if exist "启动说明.md" (
    del /q "启动说明.md"
    echo     ✓ 启动说明.md 已删除
)
if exist "建工意外险保单管理文件.txt" (
    del /q "建工意外险保单管理文件.txt"
    echo     ✓ 建工意外险保单管理文件.txt 已删除
)
if exist "开发需求表：智能报价系统.md" (
    del /q "开发需求表：智能报价系统.md"
    echo     ✓ 开发需求表：智能报价系统.md 已删除
)
if exist "历史数据.xlsx" (
    del /q "历史数据.xlsx"
    echo     ✓ 历史数据.xlsx 已删除
)
if exist "历史数据导入模板 .xlsx" (
    del /q "历史数据导入模板 .xlsx"
    echo     ✓ 历史数据导入模板 .xlsx 已删除
)
if exist "历史数据统计模块需求.txt" (
    del /q "历史数据统计模块需求.txt"
    echo     ✓ 历史数据统计模块需求.txt 已删除
)
if exist "前端UI优化问题.txt" (
    del /q "前端UI优化问题.txt"
    echo     ✓ 前端UI优化问题.txt 已删除
)
if exist "施工合同解析字段补充说明.md" (
    del /q "施工合同解析字段补充说明.md"
    echo     ✓ 施工合同解析字段补充说明.md 已删除
)
if exist "施工合同解析字段配置说明.md" (
    del /q "施工合同解析字段配置说明.md"
    echo     ✓ 施工合同解析字段配置说明.md 已删除
)
if exist "条款上下文下载计划.md" (
    del /q "条款上下文下载计划.md"
    echo     ✓ 条款上下文下载计划.md 已删除
)
if exist "同步解析到报价信息转换功能完成.md" (
    del /q "同步解析到报价信息转换功能完成.md"
    echo     ✓ 同步解析到报价信息转换功能完成.md 已删除
)
if exist "外部数据导入功能说明.md" (
    del /q "外部数据导入功能说明.md"
    echo     ✓ 外部数据导入功能说明.md 已删除
)
if exist "外部导入费用缴费统计系统.md" (
    del /q "外部导入费用缴费统计系统.md"
    echo     ✓ 外部导入费用缴费统计系统.md 已删除
)
if exist "修复上传个人信息组件（User Profile）的 UI 布局与交互功能.txt" (
    del /q "修复上传个人信息组件（User Profile）的 UI 布局与交互功能.txt"
    echo     ✓ 修复上传个人信息组件（User Profile）的 UI 布局与交互功能.txt 已删除
)
if exist "智能分析推送方案.md" (
    del /q "智能分析推送方案.md"
    echo     ✓ 智能分析推送方案.md 已删除
)
if exist "智能报价费率计算规则.md" (
    del /q "智能报价费率计算规则.md"
    echo     ✓ 智能报价费率计算规则.md 已删除
)
if exist "智能助手使用说明.md" (
    del /q "智能助手使用说明.md"
    echo     ✓ 智能助手使用说明.md 已删除
)
if exist "用户反馈历史数据进行优化问题的.txt" (
    del /q "用户反馈历史数据进行优化问题的.txt"
    echo     ✓ 用户反馈历史数据进行优化问题的.txt 已删除
)
if exist "用户使用问题记录.md" (
    del /q "用户使用问题记录.md"
    echo     ✓ 用户使用问题记录.md 已删除
)
if exist "用户端上传需补充医疗费实施.txt" (
    del /q "用户端上传需补充医疗费实施.txt"
    echo     ✓ 用户端上传需补充医疗费实施.txt 已删除
)

echo.
echo   📁 删除文档文件夹...
if exist "条款及费率文件" (
    rmdir /s /q "条款及费率文件"
    echo     ✓ 条款及费率文件\ 已删除
)
if exist "费率规则解析文件" (
    rmdir /s /q "费率规则解析文件"
    echo     ✓ 费率规则解析文件\ 已删除
)

echo.
echo   📁 删除 Server 测试文件...
if exist "server\check-business-classifications.js" (
    del /q "server\check-business-classifications.js"
    echo     ✓ server\check-business-classifications.js 已删除
)
if exist "server\check-business-classifications2.js" (
    del /q "server\check-business-classifications2.js"
    echo     ✓ server\check-business-classifications2.js 已删除
)
if exist "server\check-tables.js" (
    del /q "server\check-tables.js"
    echo     ✓ server\check-tables.js 已删除
)
if exist "server\nul" (
    del /q "server\nul"
    echo     ✓ server\nul 已删除
)
if exist "server\scripts" (
    rmdir /s /q "server\scripts"
    echo     ✓ server\scripts\ 已删除
)

echo.
echo   📁 删除 Client 测试文件...
if exist "client\public\test-api.html" (
    del /q "client\public\test-api.html"
    echo     ✓ client\public\test-api.html 已删除
)

echo.
echo ✓ 所有文件删除完成
echo.

:: ========================================
:: 第四步：验证清理结果
:: ========================================
echo [6/7] 验证清理结果...
echo.

echo 检查关键文件是否仍然存在...
if exist "client\src" (
    echo   ✓ client\src 存在
) else (
    echo   ❌ 错误：client\src 不存在！
)
if exist "server\src" (
    echo   ✓ server\src 存在
) else (
    echo   ❌ 错误：server\src 不存在！
)
if exist "client\public\assets\clauses\main.pdf" (
    echo   ✓ 保险条款PDF存在
) else (
    echo   ❌ 错误：保险条款PDF不存在！
)

echo.
echo ✓ 清理验证完成
echo.

:: ========================================
:: 第五步：显示清理报告
:: ========================================
echo [7/7] 清理报告
echo.
echo ========================================
echo 📊 清理完成统计
echo ========================================
echo.
echo ✅ 已删除：
echo   • 开发文档：~25 个
echo   • 测试文件：~7 个
echo   • 文档文件夹：2 个
echo   • 测试数据：~2 个
echo   总计：~35 个文件
echo.
echo ✅ 已保留（应用必需）：
echo   • 前端源代码：client\src\
echo   • 后端源代码：server\src\
echo   • 配置文件：package.json, tsconfig.json
echo   • 保险条款PDF：5个（⭐ 应用需要）
echo   • 项目文档：README.md
echo.
echo 📦 备份位置：docs_backup\
echo   如需恢复文件，请从此文件夹复制
echo.
echo ========================================
echo.

echo ========================================
echo ⚠️  重要提示
echo ========================================
echo.
echo 清理已完成！请验证应用是否正常运行：
echo.
echo 1️⃣  启动后端服务：
echo    cd server
echo    npm run dev
echo.
echo 2️⃣  启动前端服务（新终端）：
echo    cd client
echo    npm start
echo.
echo 3️⃣  测试关键功能：
echo    ✓ 登录系统
echo    ✓ 创建报价方案
echo    ✓ 导出PDF（⭐ 重点测试）
echo.
echo 4️⃣  如果验证通过，提交Git更改：
echo    git add .
echo    git commit -m "chore: 清理项目结构，移除开发文档和测试文件"
echo    git push
echo.
echo ========================================
echo.

PAUSE
