/**
 * Events shareed between renderer and main process.
 */
const enum FlossEvent {
    Error = 'floss-error',
    Done = 'floss-done',
    Start = 'floss-start'
}

export { FlossEvent };
