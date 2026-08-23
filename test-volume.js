// Test script to manually trigger volume event
const event = new KeyboardEvent('keydown', {
  key: 'ArrowRight',
  code: 'ArrowRight',
  keyCode: 39,
  which: 39,
  bubbles: true,
  cancelable: true
});

console.log('Dispatching ArrowRight event...');
window.dispatchEvent(event);
console.log('Event dispatched');
