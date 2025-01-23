const express = require("express");
const router = express.Router();

const tenantController = require("../controllers/tenantController");

router.get("/", tenantController.listTenants);
router.delete("/:id", tenantController.excluirTenant);
router.patch("/:id", tenantController.atualizarTenant);
router.get("/:id", tenantController.readOne);

module.exports = router;
