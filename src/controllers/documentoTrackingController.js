const DocumentoTracking = require("../models/documentoTracking");
const { sendPaginatedResponse } = require("../utils/helpers");

const listDocumentoTracking = async (req, res) => {
  try {
    const { sortBy, pageIndex, pageSize, searchTerm, tipo, ...rest } =
      req.query;

    const page = parseInt(pageIndex) || 0;
    const limite = parseInt(pageSize) || 10;
    const skip = page * limite;

    const queryResult = {
      tenant: req.tenant,
    };

    const [documentostracking, totalDeDocumentosTracking] = await Promise.all([
      DocumentoTracking.find(queryResult)
        .skip(skip)
        .limit(limite)
        .sort({ createdAt: -1 }),
      DocumentoTracking.countDocuments(queryResult),
    ]);

    sendPaginatedResponse({
      res,
      statusCode: 200,
      results: documentostracking,
      pagination: {
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limite),
        totalItems: totalDeDocumentosTracking,
        totalPages: Math.ceil(totalDeDocumentosTracking / limite),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar tracking de documentos", error);
    res.status(500).json({
      error: "Erro ao buscar tracking de documentos",
    });
  }
};

module.exports = { listDocumentoTracking };
