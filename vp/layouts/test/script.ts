import { Toast } from 'vanilla-jui'
import { testInfo, testError } from 'vanilla-press/vp-runtime'

Toast.info(testInfo())
console.error(testError())
