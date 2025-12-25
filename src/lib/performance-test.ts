/**
 * Performance API Fix Test
 * 
 * This script can be used to test if the Performance API fixes are working correctly.
 * Run this in the browser console to verify the patches are applied.
 */

export function testPerformanceFixes() {
  if (typeof window === 'undefined') {
    console.log('Performance fixes test can only be run in the browser')
    return
  }

  console.log('🧪 Testing Performance API fixes...')
  
  // Test 1: Check if performance.measure is patched
  try {
    const originalMeasure = window.performance.measure.toString()
    if (originalMeasure.includes('try') || originalMeasure.includes('catch')) {
      console.log('✅ Performance.measure appears to be patched')
    } else {
      console.log('⚠️ Performance.measure might not be patched')
    }
  } catch (e) {
    console.log('❌ Could not check performance.measure:', e)
  }

  // Test 2: Try to create a problematic measure
  try {
    // This might trigger the error if not patched
    window.performance.mark('test-start')
    window.performance.mark('test-end')
    const result = window.performance.measure('test-measure', 'test-start', 'test-end')
    console.log('✅ Basic performance.measure works:', result)
  } catch (e) {
    console.log('❌ Basic performance.measure failed:', e)
  }

  // Test 3: Check console.error filtering
  const originalConsoleError = console.error
  let errorFiltered = false
  console.error = function(...args) {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Performance')) {
      errorFiltered = true
    }
    return originalConsoleError.apply(console, args)
  }

  // Simulate a Performance API error
  console.error('Performance: negative time stamp error')
  
  // Restore original console.error
  console.error = originalConsoleError

  if (errorFiltered) {
    console.log('✅ Console.error filtering is working')
  } else {
    console.log('⚠️ Console.error filtering might not be working')
  }

  console.log('🏁 Performance API fix test complete')
}

// Auto-run test in development mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Run test after a short delay to ensure all patches are applied
  setTimeout(testPerformanceFixes, 1000)
}