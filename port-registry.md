# port-registry

本仓固定端口表。任何需要本地起 HTTP 服务 / shell 的工具都得从这里领。

| 用途 | 端口 | 备注 |
|---|---|---|
| README preview shell（`preview-readme.html`） | `5189` | 仓库根 HTTP。`python -m http.server 5189`，浏览器开 `http://127.0.0.1:5189/preview-readme.html` |

## 占用 / 释放

| 动作 | 命令（PowerShell） |
|---|---|
| 看 5189 是否被占 | `Test-NetConnection -ComputerName 127.0.0.1 -Port 5189 -InformationLevel Quiet` |
| 找占用进程 | `Get-NetTCPConnection -LocalPort 5189 -State Listen \| Select-Object OwningProcess` |
| 释放 | `Stop-Process -Id <pid> -Force` |

## 为什么不是 5173 / 5500

`5173` 容易撞 Vite 默认；`5500` 被 Python Live Server 之类常占。挑一个偏门数字，写在 registry 里别每次拍脑袋。
