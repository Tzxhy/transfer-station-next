import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '.yarn/**',
  ]),
  {
    rules: {
      // 以下为 eslint-config-next 16 新增的 React Compiler 校验规则，
      // 会对既有代码（渲染期读取 ref 等历史写法）直接报错，升级期间暂不启用
      'react-hooks/refs': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/immutability': 'off',
    },
  },
])

export default eslintConfig