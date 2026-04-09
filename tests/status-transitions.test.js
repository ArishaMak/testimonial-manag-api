// проверка переходов статуса отзыва (тестим бизнес-логику)

// импорт констант проекта (берем объект)
const { ALLOWED_STATUS_TRANSITIONS } = require('../lib/constants');

// описание группы тестов для голики переходов статуса
describe('Status Transitions Logic', () => {

    // ожидаем, что массив содержит значение
    test('должен разрешать переход draft → recording', () => {
        expect(ALLOWED_STATUS_TRANSITIONS.draft).toContain('recording');
    });

    test('должен запрещать переход draft → completed', () => {
        // draft !-> сразу перейти в completed
        expect(ALLOWED_STATUS_TRANSITIONS.draft).not.toContain('completed');
    });

    test('должен разрешать цепочку: recording → processing → completed', () => {
        expect(ALLOWED_STATUS_TRANSITIONS.recording).toContain('processing');
        expect(ALLOWED_STATUS_TRANSITIONS.processing).toContain('completed');
    });

    test('shared — финальный статус (никуда нельзя перейти)', () => {
        expect(ALLOWED_STATUS_TRANSITIONS.shared).toHaveLength(0);
        expect(ALLOWED_STATUS_TRANSITIONS.shared).toEqual([]);
    });

    test('все статусы должны быть в списке переходов', () => {
        const allStatuses = ['draft', 'recording', 'processing', 'completed', 'shared'];
        // у каждого статуса есть свои правила перехода
        allStatuses.forEach(status => {
            expect(ALLOWED_STATUS_TRANSITIONS).toHaveProperty(status);
        });
    });
});