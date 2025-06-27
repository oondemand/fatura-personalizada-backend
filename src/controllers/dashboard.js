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
                porStatus: {
                  $push: {
                    status: "$_id.status",
                    quantidade: "$quantidade",
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                kanban: "$_id",
                total: 1,
                porStatus: 1,
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
