/**
 * Dependency Validation Tests
 *
 * Tests to catch missing peer dependencies and ensure
 * expo-router and related packages are properly configured.
 *
 * Known issues to prevent:
 * 1. Missing expo-router peer dependencies (expo-linking, react-native-safe-area-context, etc.)
 * 2. TypeScript type errors (setInterval return type NodeJS.Timeout vs number)
 */
import * as fs from 'fs';
import * as path from 'path';

// Read package.json
const packageJsonPath = path.resolve(__dirname, '../../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

describe('Dependency Validation', () => {
  describe('expo-router Peer Dependencies', () => {
    /**
     * expo-router requires specific peer dependencies.
     * Missing these will cause runtime errors.
     */
    const requiredPeerDependencies = [
      'expo-linking',
      'expo-constants',
      'expo-status-bar',
      'react-native-safe-area-context',
      'react-native-screens',
      'react-native-gesture-handler',
    ];

    requiredPeerDependencies.forEach((dep) => {
      it(`should have ${dep} installed`, () => {
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        expect(allDeps).toHaveProperty(dep);
        expect(allDeps[dep]).toBeTruthy();
      });
    });

    it('should have expo-router installed', () => {
      expect(packageJson.dependencies).toHaveProperty('expo-router');
    });

    it('should have compatible react-native-safe-area-context version', () => {
      const version = packageJson.dependencies['react-native-safe-area-context'];
      expect(version).toBeTruthy();
      // Version should be >= 4.0.0 for expo-router compatibility
      // The version string might be "~5.6.0" or "^5.6.0"
      const versionMatch = version.match(/(\d+)\./);
      if (versionMatch) {
        const majorVersion = parseInt(versionMatch[1], 10);
        expect(majorVersion).toBeGreaterThanOrEqual(4);
      }
    });

    it('should have compatible react-native-screens version', () => {
      const version = packageJson.dependencies['react-native-screens'];
      expect(version).toBeTruthy();
    });
  });

  describe('React and React Native Compatibility', () => {
    it('should have react installed', () => {
      expect(packageJson.dependencies).toHaveProperty('react');
    });

    it('should have react-native installed', () => {
      expect(packageJson.dependencies).toHaveProperty('react-native');
    });

    it('should have react-dom for web support', () => {
      expect(packageJson.dependencies).toHaveProperty('react-dom');
    });

    it('should have matching react and react-dom versions', () => {
      const reactVersion = packageJson.dependencies['react'];
      const reactDomVersion = packageJson.dependencies['react-dom'];

      // Both should have the same major.minor version
      expect(reactVersion).toBe(reactDomVersion);
    });
  });

  describe('TypeScript Configuration', () => {
    it('should have typescript installed', () => {
      expect(packageJson.devDependencies).toHaveProperty('typescript');
    });

    it('should have @types/react installed', () => {
      expect(packageJson.devDependencies).toHaveProperty('@types/react');
    });

    it('should have a compatible TypeScript version (5.0+)', () => {
      const tsVersion = packageJson.devDependencies['typescript'];
      expect(tsVersion).toBeTruthy();

      // Extract major version
      const versionMatch = tsVersion.match(/(\d+)\./);
      if (versionMatch) {
        const majorVersion = parseInt(versionMatch[1], 10);
        expect(majorVersion).toBeGreaterThanOrEqual(5);
      }
    });
  });

  describe('Testing Dependencies', () => {
    const requiredTestDeps = [
      'jest',
      '@types/jest',
      '@testing-library/react-native',
      'react-test-renderer',
    ];

    requiredTestDeps.forEach((dep) => {
      it(`should have ${dep} installed`, () => {
        expect(packageJson.devDependencies).toHaveProperty(dep);
      });
    });

    it('should have jest configured', () => {
      expect(packageJson.jest).toBeTruthy();
    });

    it('should have test script defined', () => {
      expect(packageJson.scripts).toHaveProperty('test');
    });
  });

  describe('Expo SDK Dependencies', () => {
    const requiredExpoDeps = [
      'expo',
      'expo-constants',
      'expo-status-bar',
    ];

    requiredExpoDeps.forEach((dep) => {
      it(`should have ${dep} installed`, () => {
        expect(packageJson.dependencies).toHaveProperty(dep);
      });
    });

    it('should have expo as the main framework', () => {
      expect(packageJson.dependencies).toHaveProperty('expo');
      const expoVersion = packageJson.dependencies['expo'];
      // Should be SDK 51+ for latest features
      const versionMatch = expoVersion.match(/(\d+)\./);
      if (versionMatch) {
        const majorVersion = parseInt(versionMatch[1], 10);
        expect(majorVersion).toBeGreaterThanOrEqual(51);
      }
    });
  });

  describe('3D/VRM Dependencies', () => {
    it('should have three.js installed', () => {
      expect(packageJson.dependencies).toHaveProperty('three');
    });

    it('should have @types/three installed for TypeScript', () => {
      expect(packageJson.devDependencies).toHaveProperty('@types/three');
    });

    it('should have @pixiv/three-vrm for VRM support', () => {
      expect(packageJson.dependencies).toHaveProperty('@pixiv/three-vrm');
    });

    it('should have expo-three for Expo GL integration', () => {
      expect(packageJson.dependencies).toHaveProperty('expo-three');
    });

    it('should have expo-gl for WebGL support', () => {
      expect(packageJson.dependencies).toHaveProperty('expo-gl');
    });
  });

  describe('Optional but Recommended Dependencies', () => {
    it('should have expo-asset for asset loading', () => {
      expect(packageJson.dependencies).toHaveProperty('expo-asset');
    });

    it('should have expo-font for custom fonts', () => {
      expect(packageJson.dependencies).toHaveProperty('expo-font');
    });
  });

  describe('Version Compatibility Matrix', () => {
    it('should have compatible expo and expo-router versions', () => {
      const expoVersion = packageJson.dependencies['expo'];
      const routerVersion = packageJson.dependencies['expo-router'];

      // Both should exist
      expect(expoVersion).toBeTruthy();
      expect(routerVersion).toBeTruthy();

      // Extract major versions
      const expoMatch = expoVersion.match(/(\d+)/);
      const routerMatch = routerVersion.match(/(\d+)/);

      if (expoMatch && routerMatch) {
        const expoMajor = parseInt(expoMatch[1], 10);
        const routerMajor = parseInt(routerMatch[1], 10);

        // expo-router 3.x works with expo 50+
        // expo-router 4.x works with expo 51+
        if (routerMajor >= 4) {
          expect(expoMajor).toBeGreaterThanOrEqual(51);
        }
      }
    });

    it('should have compatible react-native-web for web support', () => {
      if (packageJson.dependencies['react-native-web']) {
        const webVersion = packageJson.dependencies['react-native-web'];
        expect(webVersion).toBeTruthy();
      }
    });
  });

  describe('Build Configuration', () => {
    it('should have ts-jest for TypeScript testing', () => {
      expect(packageJson.devDependencies).toHaveProperty('ts-jest');
    });

    it('should have jest transform configured for TypeScript', () => {
      expect(packageJson.jest).toHaveProperty('transform');
      const transform = packageJson.jest.transform;
      expect(transform['^.+\\.(ts|tsx)$']).toBeTruthy();
    });

    it('should have setupFilesAfterEnv configured', () => {
      expect(packageJson.jest).toHaveProperty('setupFilesAfterEnv');
      expect(packageJson.jest.setupFilesAfterEnv).toContain('<rootDir>/__tests__/setup.ts');
    });
  });

  describe('TypeScript Timer Type Safety', () => {
    /**
     * This tests the known issue with setInterval return types.
     * In Node.js: NodeJS.Timeout
     * In Browser: number
     *
     * The code should handle both cases correctly.
     */
    it('should handle setInterval return type correctly', () => {
      // Simulate the pattern used in useTimeOfDay
      let intervalId: ReturnType<typeof setInterval> | undefined;

      // This should not throw a type error
      intervalId = setInterval(() => {}, 1000);

      // Cleanup should work regardless of return type
      expect(() => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      }).not.toThrow();
    });

    it('should handle setTimeout return type correctly', () => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      timeoutId = setTimeout(() => {}, 1000);

      expect(() => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }).not.toThrow();
    });
  });

  describe('Package.json Structure', () => {
    it('should have a name field', () => {
      expect(packageJson.name).toBeTruthy();
    });

    it('should have a version field', () => {
      expect(packageJson.version).toBeTruthy();
    });

    it('should be marked as private', () => {
      expect(packageJson.private).toBe(true);
    });

    it('should have a main entry point', () => {
      expect(packageJson.main).toBeTruthy();
    });

    it('should have required scripts', () => {
      const requiredScripts = ['start', 'test'];
      requiredScripts.forEach((script) => {
        expect(packageJson.scripts).toHaveProperty(script);
      });
    });
  });
});

describe('tsconfig.json Validation', () => {
  const tsconfigPath = path.resolve(__dirname, '../../tsconfig.json');

  it('should exist', () => {
    expect(fs.existsSync(tsconfigPath)).toBe(true);
  });

  it('should be valid JSON', () => {
    expect(() => {
      JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
    }).not.toThrow();
  });

  it('should extend expo/tsconfig.base', () => {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
    expect(tsconfig.extends).toBe('expo/tsconfig.base');
  });

  it('should have strict mode enabled', () => {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
    expect(tsconfig.compilerOptions?.strict).toBe(true);
  });

  it('should include TypeScript and TSX files', () => {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
    const include = tsconfig.include || [];
    expect(include.some((p: string) => p.includes('*.ts'))).toBe(true);
  });
});

describe('Node Modules Validation', () => {
  const nodeModulesPath = path.resolve(__dirname, '../../node_modules');

  it('should have node_modules directory', () => {
    expect(fs.existsSync(nodeModulesPath)).toBe(true);
  });

  const criticalPackages = [
    'expo',
    'expo-router',
    'react',
    'react-native',
    'typescript',
  ];

  criticalPackages.forEach((pkg) => {
    it(`should have ${pkg} installed in node_modules`, () => {
      const pkgPath = path.join(nodeModulesPath, pkg);
      expect(fs.existsSync(pkgPath)).toBe(true);
    });
  });
});
