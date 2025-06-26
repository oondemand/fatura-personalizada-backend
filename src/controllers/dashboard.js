const Tracking = require("../models/documentoTracking");
const mongoose = require("mongoose");

exports.caracteristicas = async (req, res) => {
  try {
    const caracteristicas = await Tracking.aggregate([
      {
        $match: {
          tenant: new mongoose.Types.ObjectId(req.tenant),
        },
      },
      {
        $facet: {
          quantidadeTotal: [{ $count: "total" }],
          quantidadePorStatus: [
            {
              $group: {
                _id: "$status",
                quantidade: { $sum: 1 },
              },
            },
          ],
          quantidadePorKanbanEStatus: [
            {
              $group: {
                _id: { kanban: "$kanban", status: "$status" },
                quantidade: { $sum: 1 },
              },
            },
            {
              $group: {
                _id: "$_id.kanban",
                total: { $sum: "$quantidade" },
                sucesso: {
                  $sum: {
                    $cond: [
                      { $eq: ["$_id.status", "sucesso"] },
                      "$quantidade",
                      0,
                    ],
                  },
                },
                falha: {
                  $sum: {
                    $cond: [
                      { $eq: ["$_id.status", "falha"] },
                      "$quantidade",
                      0,
                    ],
                  },
                },
                processando: {
                  $sum: {
                    $cond: [
                      { $eq: ["$_id.status", "processando"] },
                      "$quantidade",
                      0,
                    ],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                kanban: "$_id",
                total: 1,
                sucesso: 1,
                falha: 1,
                processando: 1,
              },
            },
          ],
        },
      },
    ]);

    res.status(200).json({
      ...caracteristicas[0],
      quantidadeTotal: caracteristicas[0].quantidadeTotal[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({
      error: "Erro ao obter características",
      message: error.message,
    });
  }
};
