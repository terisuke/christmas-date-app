import { KAORI_ENDINGS, SPOT_DATA, KAORI_SPOT_REACTIONS, KAORI_SYSTEM_PROMPT } from '../../src/constants/character';

describe('Character Constants', () => {
  describe('KAORI_ENDINGS', () => {
    it('should have all 4 ending types', () => {
      expect(KAORI_ENDINGS).toHaveProperty('BAD');
      expect(KAORI_ENDINGS).toHaveProperty('NORMAL');
      expect(KAORI_ENDINGS).toHaveProperty('GOOD');
      expect(KAORI_ENDINGS).toHaveProperty('TRUE');
    });

    it('should have valid properties for each ending', () => {
      const endings = ['BAD', 'NORMAL', 'GOOD', 'TRUE'] as const;

      endings.forEach(ending => {
        expect(KAORI_ENDINGS[ending]).toHaveProperty('title');
        expect(KAORI_ENDINGS[ending]).toHaveProperty('message');
        expect(KAORI_ENDINGS[ending]).toHaveProperty('kaoriMessage');
        expect(KAORI_ENDINGS[ending]).toHaveProperty('expression');
      });
    });

    it('should have correct expressions for each ending', () => {
      expect(KAORI_ENDINGS.BAD.expression).toBe('sad');
      expect(KAORI_ENDINGS.NORMAL.expression).toBe('neutral');
      expect(KAORI_ENDINGS.GOOD.expression).toBe('happy');
      expect(KAORI_ENDINGS.TRUE.expression).toBe('shy');
    });
  });

  describe('SPOT_DATA', () => {
    it('should have 9 spots total', () => {
      expect(SPOT_DATA).toHaveLength(9);
    });

    it('should have 6 normal spots and 3 secret spots', () => {
      const normalSpots = SPOT_DATA.filter(spot => !spot.is_secret);
      const secretSpots = SPOT_DATA.filter(spot => spot.is_secret);

      expect(normalSpots).toHaveLength(6);
      expect(secretSpots).toHaveLength(3);
    });

    it('should have valid properties for each spot', () => {
      SPOT_DATA.forEach(spot => {
        expect(spot).toHaveProperty('id');
        expect(spot).toHaveProperty('name');
        expect(spot).toHaveProperty('lat');
        expect(spot).toHaveProperty('lng');
        expect(spot).toHaveProperty('base_point');
        expect(spot).toHaveProperty('is_secret');
        expect(spot).toHaveProperty('description');
        expect(spot).toHaveProperty('event_script');
      });
    });

    it('should have valid event scripts with choices', () => {
      SPOT_DATA.forEach(spot => {
        expect(spot.event_script).toHaveProperty('title');
        expect(spot.event_script).toHaveProperty('dialogue');
        expect(spot.event_script).toHaveProperty('choices');
        expect(spot.event_script.choices.length).toBeGreaterThanOrEqual(2);

        spot.event_script.choices.forEach(choice => {
          expect(choice).toHaveProperty('text');
          expect(choice).toHaveProperty('points');
          expect(choice).toHaveProperty('affection');
        });
      });
    });

    it('should have secret spots with higher base points', () => {
      const secretSpots = SPOT_DATA.filter(spot => spot.is_secret);

      secretSpots.forEach(spot => {
        expect(spot.base_point).toBeGreaterThanOrEqual(200);
      });
    });

    it('should have valid coordinates within Fukuoka area', () => {
      SPOT_DATA.forEach(spot => {
        // Fukuoka area roughly: lat 33.5-33.7, lng 130.3-130.5
        expect(spot.lat).toBeGreaterThan(33.5);
        expect(spot.lat).toBeLessThan(33.7);
        expect(spot.lng).toBeGreaterThan(130.3);
        expect(spot.lng).toBeLessThan(130.5);
      });
    });
  });

  describe('KAORI_SPOT_REACTIONS', () => {
    it('should have reactions for all spots', () => {
      SPOT_DATA.forEach(spot => {
        expect(KAORI_SPOT_REACTIONS).toHaveProperty(spot.id);
      });
    });

    it('should have valid expression and greeting for each reaction', () => {
      Object.values(KAORI_SPOT_REACTIONS).forEach(reaction => {
        expect(reaction).toHaveProperty('expression');
        expect(reaction).toHaveProperty('greeting');
        expect(['neutral', 'happy', 'shy', 'surprised', 'sad', 'thinking']).toContain(reaction.expression);
        expect(reaction.greeting.length).toBeGreaterThan(0);
      });
    });
  });

  describe('KAORI_SYSTEM_PROMPT', () => {
    it('should contain character basic info', () => {
      expect(KAORI_SYSTEM_PROMPT).toContain('雪村かおり');
      expect(KAORI_SYSTEM_PROMPT).toContain('17歳');
      expect(KAORI_SYSTEM_PROMPT).toContain('北海道');
      expect(KAORI_SYSTEM_PROMPT).toContain('小樽');
    });

    it('should contain personality traits', () => {
      expect(KAORI_SYSTEM_PROMPT).toContain('シャイ');
      expect(KAORI_SYSTEM_PROMPT).toContain('人見知り');
    });

    it('should contain speech patterns', () => {
      expect(KAORI_SYSTEM_PROMPT).toContain('...');
      expect(KAORI_SYSTEM_PROMPT).toContain('なまら');
    });
  });
});
