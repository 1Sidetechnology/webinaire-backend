import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import env from "./config/env";
import { checkDatabaseConnection } from "./config/database";
import { GoogleService } from "./services/google.service";
import { EmailService } from "./services/email.service";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import routes from "./routes";
import { initReminderJob } from "./jobs/reminder.job";

/**
 * Application Express principale
 */
class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialiser les middlewares
   */
  private initializeMiddlewares(): void {
    // Security headers
    this.app.use(helmet());

    // CORS
    this.app.use(
      cors({
        origin: env.NODE_ENV === "production" ? env.API_URL : "*",
        credentials: true,
      })
    );

    // Body parsers
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Max 100 requêtes par IP
      message: "Trop de requêtes, veuillez réessayer plus tard.",
    });
    this.app.use("/api/", limiter);

    // Webhook rate limiter (plus permissif)
    const webhookLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 50,
    });
    this.app.use("/api/payment/webhook", webhookLimiter);
  }

  /**
   * Initialiser les routes
   */
  private initializeRoutes(): void {
    // Health check
    this.app.get("/health", (_req: Request, res: Response) => {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
      });
    });

    // API routes
    this.app.use("/api", routes);

    // Page d'accueil
    this.app.get("/", (_req: Request, res: Response) => {
      res.json({
        message: "API Système de Webinaires",
        version: "1.0.0",
        endpoints: {
          health: "/health",
          api: "/api",
          docs: "/api/docs", // À implémenter plus tard
        },
      });
    });
  }

  /**
   * Initialiser la gestion des erreurs
   */
  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Démarrer le serveur
   */
  public async start(): Promise<void> {
    try {
      // Vérifier la connexion à Supabase
      const dbConnected = await checkDatabaseConnection();
      if (!dbConnected) {
        throw new Error("Impossible de se connecter à Supabase");
      }

      // Initialiser les services
      GoogleService.initialize();
      EmailService.initialize();

      // Vérifier la connexion SMTP
      await EmailService.verifyConnection();

      // Initialiser le cron job des rappels (seulement en production)
      if (env.NODE_ENV === "production") {
        initReminderJob();
      } else {
        console.log("⚠️  Mode développement : Cron jobs désactivés");
      }

      // Démarrer le serveur
      this.app.listen(env.PORT, () => {
        console.log("");
        console.log("=".repeat(50));
        console.log(`🚀 Serveur démarré sur le port ${env.PORT}`);
        console.log(`📍 URL: ${env.API_URL}`);
        console.log(`🌍 Environnement: ${env.NODE_ENV}`);
        console.log("=".repeat(50));
        console.log("");
        console.log("Endpoints disponibles:");
        console.log(`  GET  ${env.API_URL}/health`);
        console.log(`  POST ${env.API_URL}/api/auth/register`);
        console.log(`  POST ${env.API_URL}/api/auth/login`);
        console.log(`  GET  ${env.API_URL}/api/webinars`);
        console.log(`  POST ${env.API_URL}/api/webinars`);
        console.log(`  POST ${env.API_URL}/api/registrations`);
        console.log(`  POST ${env.API_URL}/api/payment/webhook`);
        console.log("");
        console.log("=".repeat(50));
      });
    } catch (error) {
      console.error("❌ Erreur au démarrage du serveur:", error);
      process.exit(1);
    }
  }
}

// Créer et démarrer l'application
const app = new App();
app.start();

// Gestion des erreurs non capturées
process.on("unhandledRejection", (reason: any) => {
  console.error("❌ Unhandled Rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error: Error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

export default app;
