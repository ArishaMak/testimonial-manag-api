//статусы отзыва. будем юзать в модели, контроллере, middleware
const TESTIMONIAL_STATUSES = {
    DRAFT: 'draft',
    RECORDING: 'recording',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    SHARED: 'shared'
}

//допустимые переходы статусов
const ALLOWED_STATUS_TRANSITIONS = {
    draft: ['recording'],
    recording: ['processing'],
    processing: ['completed'],
    completed: ['shared'],
    shared: []
}

//каналы шаринга
const SHARING_CHANNELS = ['email', 'sms', 'facebook', 'instagram']

module.exports = {
    TESTIMONIAL_STATUSES,
    ALLOWED_STATUS_TRANSITIONS,
    SHARING_CHANNELS
}