import { RepoManifest } from '../types/repo';
import { buildDependencyGraph } from './graphBuilder';
import { runRiskHeuristics } from './riskAnalyzer';
import { parseFile } from './scanner';

const NEXUS_FILES = [
  {
    path: 'src/server.ts',
    content: `import express from 'express';
import { authRouter } from './routes/auth';
import { paymentRouter } from './routes/payment';
import { inventoryService } from './services/inventoryService';
import { logger } from './utils/logger';

const app = express();
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/payment', paymentRouter);

app.get('/health', (req, res) => {
  logger.info('Health check ping received');
  res.json({ status: 'ok', inventory: inventoryService.getStatus() });
});

app.listen(3000, () => logger.info('Server running on port 3000'));`
  },
  {
    path: 'src/routes/auth.ts',
    content: `import { Router } from 'express';
import { db } from '../db/connection';
import { logger } from '../utils/logger';
import { paymentService } from '../services/paymentService';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  logger.info(\`Login attempt for \${email}\`);
  const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  
  // Checking user billing status on auth login
  const billing = await paymentService.getSubscriptionStatus(user.id);
  res.json({ token: 'jwt_secret_token_x902', user, billing });
});`
  },
  {
    path: 'src/routes/payment.ts',
    content: `import { Router } from 'express';
import { paymentService } from '../services/paymentService';
import { logger } from '../utils/logger';

export const paymentRouter = Router();

paymentRouter.post('/checkout', async (req, res) => {
  try {
    const { userId, amount, currency, items } = req.body;
    logger.info(\`Checkout started for user \${userId}\`);
    const result = await paymentService.processTransaction(userId, amount, currency, items);
    res.json(result);
  } catch (err: any) {
    logger.error('Checkout failed', err);
    res.status(500).json({ error: err.message });
  }
});`
  },
  {
    path: 'src/services/paymentService.ts',
    content: `import { db } from '../db/connection';
import { inventoryService } from './inventoryService';
import { logger } from '../utils/logger';
import { authRouter } from '../routes/auth'; // Circular import dependency!

export class PaymentService {
  async processTransaction(userId: string, amount: number, currency: string, items: any[]) {
    logger.info(\`Processing payment \${amount} \${currency}\`);
    
    // Extreme cyclomatic complexity & nesting
    if (amount <= 0) {
      throw new Error('Invalid amount');
    } else {
      if (currency !== 'USD' && currency !== 'EUR' && currency !== 'GBP') {
        if (currency === 'CAD') {
          amount = amount * 0.75;
        } else if (currency === 'JPY') {
          amount = amount * 0.0067;
        } else if (currency === 'AUD') {
          amount = amount * 0.65;
        } else {
          throw new Error('Unsupported currency');
        }
      }
      
      for (const item of items) {
        if (item.quantity > 0) {
          if (item.inStock) {
            const reserved = await inventoryService.reserveStock(item.id, item.quantity);
            if (!reserved) {
              throw new Error(\`Failed to reserve stock for item \${item.id}\`);
            }
          } else {
            throw new Error('Item out of stock');
          }
        }
      }
    }

    const txId = 'tx_' + Math.random().toString(36).substring(2, 9);
    await db.query('INSERT INTO transactions (id, user_id, amount) VALUES ($1, $2, $3)', [txId, userId, amount]);
    return { success: true, transactionId: txId };
  }

  async getSubscriptionStatus(userId: string) {
    return { status: 'active', tier: 'premium' };
  }
}

export const paymentService = new PaymentService();`
  },
  {
    path: 'src/services/inventoryService.ts',
    content: `import { db } from '../db/connection';
import { paymentService } from './paymentService'; // Circular import dependency!
import { logger } from '../utils/logger';

export class InventoryService {
  async reserveStock(itemId: string, quantity: number): Promise<boolean> {
    logger.info(\`Reserving \${quantity} of item \${itemId}\`);
    const item = await db.query('SELECT stock FROM inventory WHERE id = $1', [itemId]);
    if (!item || item.stock < quantity) {
      return false;
    }
    await db.query('UPDATE inventory SET stock = stock - $1 WHERE id = $2', [quantity, itemId]);
    return true;
  }

  getStatus() {
    return { healthy: true, totalItems: 1420 };
  }
}

export const inventoryService = new InventoryService();`
  },
  {
    path: 'src/db/connection.ts',
    content: `import { logger } from '../utils/logger';

export class Database {
  async query(sql: string, params: any[] = []) {
    logger.info(\`SQL Exec: \${sql}\`, params);
    return { id: 'usr_123', email: 'user@nexus.com', stock: 100 };
  }
}

export const db = new Database();`
  },
  {
    path: 'src/utils/logger.ts',
    content: `export const logger = {
  info: (msg: string, ...meta: any[]) => console.log(\`[INFO] \${msg}\`, ...meta),
  error: (msg: string, ...meta: any[]) => console.error(\`[ERROR] \${msg}\`, ...meta),
  warn: (msg: string, ...meta: any[]) => console.warn(\`[WARN] \${msg}\`, ...meta)
};`
  },
  {
    path: 'analytics/fraud_detector.py',
    content: `import math
import logging

logging.basicConfig(level=logging.INFO)

class FraudDetector:
    def __init__(self, threshold=0.85):
        self.threshold = threshold

    def analyze_transaction(self, user_id, amount, ip_address, device_fingerprint):
        score = 0.1
        if amount > 10000:
            score += 0.4
        elif amount > 5000:
            score += 0.2
            
        if ip_address.startswith('192.168.'):
            score -= 0.1
        else:
            score += 0.3
            
        if score > self.threshold:
            logging.warning(f"High risk transaction detected for {user_id}: {score}")
            return {"flagged": True, "risk_score": score}
        return {"flagged": False, "risk_score": score}`
  },
  {
    path: 'auth_service/main.go',
    content: `package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type TokenResponse struct {
	Token string \`json:"token"\`
	Valid bool   \`json:"valid"\`
}

func validateTokenHandler(w http.ResponseWriter, r *http.Request) {
	token := r.Header.Get("Authorization")
	if token == "" {
		http.Error(w, "Missing token", http.StatusUnauthorized)
		return
	}
	resp := TokenResponse{Token: token, Valid: true}
	json.NewEncoder(w).Encode(resp)
}

func main() {
	http.HandleFunc("/validate", validateTokenHandler)
	fmt.Println("Go Auth Service running on :8080")
	http.ListenAndServe(":8080", nil)
}`
  }
];

export function buildManifestFromRawFiles(
  name: string,
  description: string,
  rawFiles: { path: string; content: string }[],
  source: 'sample' | 'custom_zip' | 'custom_git' = 'sample'
): RepoManifest {
  const parsedFiles = rawFiles.map(rf => parseFile(rf.path, rf.content));
  const { edges, scores, cycles } = buildDependencyGraph(parsedFiles);
  const risks = runRiskHeuristics(parsedFiles, scores, cycles);

  const langMap: Record<string, number> = {};
  let totalLoc = 0;

  parsedFiles.forEach(f => {
    langMap[f.language] = (langMap[f.language] || 0) + f.loc;
    totalLoc += f.loc;
  });

  // Calculate overall repo health (0-100)
  const fileHealthList = Object.values(scores).map(s => s.healthScore);
  const avgHealth = fileHealthList.length > 0 ? Math.round(fileHealthList.reduce((a, b) => a + b, 0) / fileHealthList.length) : 80;
  const healthDeduction = (cycles.length * 8) + (risks.filter(r => r.severity === 'critical').length * 10);
  const healthScore = Math.max(Math.min(avgHealth - healthDeduction, 100), 15);

  return {
    id: name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    name,
    description,
    source,
    files: parsedFiles,
    edges,
    scores,
    cycles,
    risks,
    healthScore,
    languageBreakdown: langMap,
    totalLoc,
    totalFiles: parsedFiles.length,
    lastScannedAt: new Date().toISOString(),
    aiArchitectureSummary: `Multi-service codebase consisting of TypeScript/Node HTTP APIs, Python AI analytics modules, and Go authentication microservices. Features ${parsedFiles.length} source files across ${Object.keys(langMap).length} languages with ${cycles.length} detected circular import cycles and ${risks.length} heuristic risk findings.`
  };
}

export function getSampleRepositories(): RepoManifest[] {
  return [
    buildManifestFromRawFiles(
      'Nexus E-Commerce Platform',
      'Fullstack Node.js API with Python Analytics & Go Microservice',
      NEXUS_FILES
    )
  ];
}
