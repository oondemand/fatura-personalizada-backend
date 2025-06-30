const Log = require("../models/log");
const { sendPaginatedResponse } = require("../utils/helpers");

class LogController {
  static async getLogs(req, res) {
    try {
      const { sortBy, pageIndex, pageSize, searchTerm, tipo, ...rest } =
        req.query;

      const page = parseInt(pageIndex) || 0;
      const limite = parseInt(pageSize) || 10;
      const skip = page * limite;

      const queryResult = {
        tenant: req.tenant,
      };

      const [logs, totalDeLogs] = await Promise.all([
        Log.find(queryResult)
          .skip(skip)
          .limit(limite)
          .populate("usuario", "id nome")
          .sort({ createdAt: -1 }),
        Log.countDocuments(queryResult),
      ]);

      sendPaginatedResponse({
        res,
        statusCode: 200,
        results: logs,
        pagination: {
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limite),
          totalItems: totalDeLogs,
          totalPages: Math.ceil(totalDeLogs / limite),
        },
      });
    } catch (error) {
      console.error("Erro ao buscar logs de rastreabilidade:", error);
      res.status(500).json({ error: "Erro ao buscar logs de rastreabilidade" });
    }
  }

  static async limparLogs(req, res) {
    try {
      await Log.deleteMany({ tenant: req.tenant });
      res
        .status(200)
        .json({ message: "Logs de rastreabilidade apagados com sucesso" });
    } catch (error) {
      console.error("Erro ao apagar logs de rastreabilidade:", error);
      res.status(500).json({ error: "Erro ao apagar logs de rastreabilidade" });
    }
  }
}

module.exports = LogController;
