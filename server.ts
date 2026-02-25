import express from "express";
import { createServer as createViteServer } from "vite";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Route for PDF generation
  app.post("/api/generate-pdf", async (req, res) => {
    const data = req.body;
    
    if (!data) {
      return res.status(400).send("Missing data");
    }

    let browser;
    try {
      browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: true
      });

      const page = await browser.newPage();
      
      // Load the template
      const templatePath = path.join(__dirname, "listone.html");
      const htmlContent = fs.readFileSync(templatePath, "utf-8");
      
      await page.setContent(htmlContent);
      
      // Inject data and render
      await page.evaluate((data) => {
        // @ts-ignore
        window.renderListone(data);
      }, data);

      // Wait for any rendering to finish
      await new Promise(r => setTimeout(r, 500));

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "45mm", // Space for the header
          bottom: "20mm",
          left: "10mm",
          right: "10mm"
        },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-family: Arial, sans-serif; font-size: 8pt; width: 100%; margin: 0 10mm; border-bottom: 1px solid #000; padding-bottom: 5px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
              <div style="width: 150px;">UTENTE: ${data.utente || 'N/D'}</div>
              <div style="text-align: center; flex: 1;">
                <div style="font-weight: bold; text-transform: uppercase;">Ministero dell'Interno</div>
                <div style="font-weight: bold; text-transform: uppercase;">Comando VV.F. ${data.comando || 'MILANO'}</div>
                <div style="font-size: 6pt; margin-top: 2px;">DIPARTIMENTO DEI VIGILI DEL FUOCO DEL SOCCORSO PUBBLICO E DELLA DIFESA CIVILE</div>
              </div>
              <div style="width: 150px; text-align: right;">
                Pagina <span class="pageNumber"></span> di <span class="totalPages"></span>
              </div>
            </div>
          </div>
        `,
        footerTemplate: '<div></div>' // Empty footer
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=Listone_${data.data_giorno}.pdf`);
      res.send(pdfBuffer);

    } catch (error) {
      console.error("PDF Generation Error:", error);
      res.status(500).send("Error generating PDF: " + (error as Error).message);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
