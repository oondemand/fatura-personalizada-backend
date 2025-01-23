const Log = require('../models/log');

class DashboardController {
  static async getRastreabilidadeLogs(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const logs = await Log.find({tenant: req.tenant})
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }) // Ordena por mais recente
        .populate('usuario', 'id nome'); // Popula com o id e nome do usuário

      const totalLogs = await Log.countDocuments();

      res.status(200).json({
        totalLogs,
        totalPages: Math.ceil(totalLogs / limit),
        currentPage: parseInt(page),
        logs
      });
    } catch (error) {
      console.error("Erro ao buscar logs de rastreabilidade:", error);
      res.status(500).json({ error: "Erro ao buscar logs de rastreabilidade" });
    }
  }

  static async limparLogs(req, res) {
    try {
      await Log.deleteMany({tenant: req.tenant});
      res.status(200).json({ message: "Logs de rastreabilidade apagados com sucesso" });
    } catch (error) {
      console.error("Erro ao apagar logs de rastreabilidade:", error);
      res.status(500).json({ error: "Erro ao apagar logs de rastreabilidade" });
    }
  }
}

module.exports = DashboardController;
