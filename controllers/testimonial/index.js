// главный экспорт контроллеров для отзывов - собираем все из отдельных файлов и экспортируем одним объектом в роутер
const { create, getAll, getOne, update, softDelete } = require('./testimonial.controller');
const { updateStatus, bulkUpdateStatus } = require('./status.controller');
const { share } = require('./sharing.controller');
const { getSettings, upsertSettings } = require('./settings.controller');
const { search } = require('./search.controller');
const { getAnalytics } = require('./analytics.controller');
const { exportCsv } = require('./export.controller');

module.exports = {
    // CRUD
    create,
    getAll,
    getOne,
    update,
    softDelete,

    // Status
    updateStatus,
    bulkUpdateStatus,

    // Sharing
    share,

    // Settings
    getSettings,
    upsertSettings,

    // Analytics
    getAnalytics,

    // Search & Export
    search,
    exportCsv
};