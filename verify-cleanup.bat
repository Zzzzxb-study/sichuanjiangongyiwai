@echo off
chcp 65001 >nul
cls
echo ========================================
echo 🔍 应用验证脚本
echo ========================================
echo.
echo 此脚本将验证清理后的应用是否正常运行
echo.
echo ========================================
echo.

:: ========================================
:: 验证步骤1：检查关键文件
:: ========================================
echo [1/5] 检查关键文件...
echo.

set ERRORS=0

:: 检查前端
echo 📂 检查前端文件...
if exist "client\src\App.tsx" (
    echo   ✓ client\src\App.tsx 存在
) else (
    echo   ❌ client\src\App.tsx 不存在
    set ERRORS=1
)

if exist "client\src\pages\Dashboard\Dashboard.tsx" (
    echo   ✓ client\src\pages\Dashboard\Dashboard.tsx 存在
) else (
    echo   ❌ client\src\pages\Dashboard\Dashboard.tsx 不存在
    set ERRORS=1
)

if exist "client\src\pages\PricingPlans\PricingPlans.tsx" (
    echo   ✓ client\src\pages\PricingPlans\PricingPlans.tsx 存在
) else (
    echo   ❌ client\src\pages\PricingPlans\PricingPlans.tsx 不存在
    set ERRORS=1
)

if exist "client\package.json" (
    echo   ✓ client\package.json 存在
) else (
    echo   ❌ client\package.json 不存在
    set ERRORS=1
)

:: 检查保险条款PDF（⭐ 关键）
echo.
echo ⭐ 检查保险条款PDF（应用导出需要）...
if exist "client\public\assets\clauses\main.pdf" (
    echo   ✓ main.pdf 存在（主险条款）
) else (
    echo   ❌ main.pdf 不存在！PDF导出将失败！
    set ERRORS=1
)

if exist "client\public\assets\clauses\medical.pdf" (
    echo   ✓ medical.pdf 存在（医疗保险条款）
) else (
    echo   ❌ medical.pdf 不存在！
    set ERRORS=1
)

if exist "client\public\assets\clauses\allowance.pdf" (
    echo   ✓ allowance.pdf 存在（住院津贴条款）
) else (
    echo   ❌ allowance.pdf 不存在！
    set ERRORS=1
)

if exist "client\public\assets\clauses\acute_disease.pdf" (
    echo   ✓ acute_disease.pdf 存在（急性病条款）
) else (
    echo   ❌ acute_disease.pdf 不存在！
    set ERRORS=1
)

if exist "client\public\assets\clauses\plateau_disease.pdf" (
    echo   ✓ plateau_disease.pdf 存在（高原病条款）
) else (
    echo   ❌ plateau_disease.pdf 不存在！
    set ERRORS=1
)

:: 检查后端
echo.
echo 📂 检查后端文件...
if exist "server\src\index.ts" (
    echo   ✓ server\src\index.ts 存在
) else (
    echo   ❌ server\src\index.ts 不存在
    set ERRORS=1
)

if exist "server\src\controllers\pricingPlanController.ts" (
    echo   ✓ server\src\controllers\pricingPlanController.ts 存在
) else (
    echo   ❌ server\src\controllers\pricingPlanController.ts 不存在
    set ERRORS=1
)

if exist "server\src\services\pricingPlanService.ts" (
    echo   ✓ server\src\services\pricingPlanService.ts 存在
) else (
    echo   ❌ server\src\services\pricingPlanService.ts 不存在
    set ERRORS=1
)

if exist "server\package.json" (
    echo   ✓ server\package.json 存在
) else (
    echo   ❌ server\package.json 不存在
    set ERRORS=1
)

:: 检查配置文件
echo.
echo 📋 检查配置文件...
if exist ".gitignore" (
    echo   ✓ .gitignore 存在
) else (
    echo   ❌ .gitignore 不存在
    set ERRORS=1
)

if exist "README.md" (
    echo   ✓ README.md 存在
) else (
    echo   ⚠️  README.md 不存在（建议保留）
)

echo.

:: ========================================
:: 验证步骤2：检查是否删除了不该删除的文件
:: ========================================
echo [2/5] 检查是否有误删的文件...
echo.

:: 测试文件应该被删除
if exist "test_match.js" (
    echo   ⚠️  test_match.js 仍然存在（应该被删除）
)
if exist "frontend_tests.py" (
    echo   ⚠️  frontend_tests.py 仍然存在（应该被删除）
)
if exist "client\public\test-api.html" (
    echo   ⚠️  client\public\test-api.html 仍然存在（应该被删除）
)

:: 文档文件夹应该被删除
if exist "条款及费率文件" (
    echo   ⚠️  条款及费率文件\ 仍然存在（应该被删除）
)
if exist "费率规则解析文件" (
    echo   ⚠️  费率规则解析文件\ 仍然存在（应该被删除）
)

echo.

:: ========================================
:: 验证步骤3：检查依赖完整性
:: ========================================
echo [3/5] 检查依赖配置...
echo.

if exist "client\node_modules" (
    echo   ✓ client\node_modules 存在（前端依赖已安装）
) else (
    echo   ⚠️  client\node_modules 不存在，需要运行：cd client ^&^& npm install
)

if exist "server\node_modules" (
    echo   ✓ server\node_modules 存在（后端依赖已安装）
) else (
    echo   ⚠️  server\node_modules 不存在，需要运行：cd server ^&^& npm install
)

echo.

:: ========================================
:: 验证步骤4：显示验证结果
:: ========================================
echo [4/5] 验证结果总结
echo.
echo ========================================
if %ERRORS%==0 (
    echo ✅ 所有检查通过！
    echo.
    echo 关键文件完整，可以继续下一步测试。
) else (
    echo ❌ 发现问题！
    echo.
    echo 部分关键文件缺失，请检查：
    echo 1. 是否误删了源代码文件
    echo 2. 是否误删了保险条款PDF文件
    echo 3. 从 docs_backup\ 恢复缺失的文件
)
echo ========================================
echo.

:: ========================================
:: 验证步骤5：提供下一步指导
:: ========================================
echo [5/5] 下一步操作
echo.
echo ========================================
if %ERRORS%==0 (
    echo ✅ 验证通过！请执行以下测试：
    echo.
    echo 1️⃣  启动后端服务：
    echo    cd server
    echo    npm run dev
    echo.
    echo 2️⃣  启动前端服务（新终端）：
    echo    cd client
    echo    npm start
    echo.
    echo 3️⃣  打开浏览器测试：
    echo    http://localhost:30001
    echo.
    echo 4️⃣  关键功能测试：
    echo    ✓ 登录系统
    echo    ✓ 查看工作台
    echo    ✓ 创建报价方案
    echo    ⭐ 导出PDF（重点测试）
    echo.
    echo 5️⃣  如果所有测试通过，提交Git：
    echo    git add .
    echo    git commit -m "chore: 清理项目结构，移除开发文档和测试文件"
    echo    git push
) else (
    echo ❌ 验证失败！请执行以下操作：
    echo.
    echo 1. 检查 docs_backup\ 文件夹
    echo 2. 恢复缺失的关键文件
    echo 3. 重新运行此验证脚本
    echo.
    echo 或者从Git恢复：
    echo    git checkout -- .
)
echo ========================================
echo.

PAUSE
