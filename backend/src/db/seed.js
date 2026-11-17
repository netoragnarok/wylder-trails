require('dotenv').config();
const db = require('./index');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  try {
    // Usuário demo
    const userId = uuidv4();
    await db.query(
      `INSERT INTO users (id, firebase_uid, name, email, avatar_url, level)
       VALUES ($1, 'demo_uid_001', 'Marina Castro', 'marina@demo.com', null, 'explorador')
       ON CONFLICT (firebase_uid) DO NOTHING`,
      [userId]
    );

    const userResult = await db.query("SELECT id FROM users WHERE firebase_uid = 'demo_uid_001'");
    const user = userResult.rows[0];

    // Trilhas de exemplo
    const trails = [
      {
        name: 'Trilha da Pedra do Baú',
        description: 'Trilha com vista incrível da Serra da Mantiqueira. Exige boa forma física.',
        location_city: 'São Bento do Sapucaí',
        location_state: 'SP',
        location_country: 'Brasil',
        difficulty: 'difícil',
        distance_km: 12.5,
        terrain_type: 'íngreme',
        estimated_duration_minutes: 300,
        has_parking: true,
        has_waterfall: true,
        has_camping: false,
        has_climbing: true,
        rating_avg: 4.8,
        rating_count: 23,
        start_lat: -22.6827,
        start_lng: -45.7291,
        photos: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400'],
      },
      {
        name: 'Circuito das Cachoeiras de Aiuruoca',
        description: 'Trilha suave por entre cachoeiras e mata atlântica preservada.',
        location_city: 'Aiuruoca',
        location_state: 'MG',
        location_country: 'Brasil',
        difficulty: 'fácil',
        distance_km: 6.2,
        terrain_type: 'plano',
        estimated_duration_minutes: 150,
        has_parking: true,
        has_waterfall: true,
        has_camping: true,
        has_river_crossing: true,
        rating_avg: 4.6,
        rating_count: 41,
        start_lat: -22.0244,
        start_lng: -44.6085,
        photos: ['https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400'],
      },
      {
        name: 'Trilha da Serra dos Órgãos',
        description: 'Travessia clássica do Parque Nacional. Requer experiência e equipamentos.',
        location_city: 'Teresópolis',
        location_state: 'RJ',
        location_country: 'Brasil',
        difficulty: 'difícil',
        distance_km: 42.0,
        terrain_type: 'mesclado',
        estimated_duration_minutes: 2880,
        has_parking: true,
        has_waterfall: true,
        has_camping: true,
        has_climbing: true,
        has_river_crossing: true,
        rating_avg: 4.9,
        rating_count: 87,
        start_lat: -22.4082,
        start_lng: -42.9861,
        photos: ['https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400'],
      },
    ];

    for (const trail of trails) {
      await db.query(
        `INSERT INTO trails (
          author_id, name, description, location_city, location_state, location_country,
          difficulty, distance_km, terrain_type, estimated_duration_minutes,
          has_parking, has_waterfall, has_camping, has_climbing, has_river_crossing,
          rating_avg, rating_count, start_lat, start_lng, photos, route, waypoints, danger_points
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,'[]','[]','[]')
        ON CONFLICT DO NOTHING`,
        [
          user.id, trail.name, trail.description, trail.location_city, trail.location_state,
          trail.location_country, trail.difficulty, trail.distance_km, trail.terrain_type,
          trail.estimated_duration_minutes, trail.has_parking || false, trail.has_waterfall || false,
          trail.has_camping || false, trail.has_climbing || false, trail.has_river_crossing || false,
          trail.rating_avg, trail.rating_count, trail.start_lat, trail.start_lng, trail.photos,
        ]
      );
    }

    console.log('✅ Seed executado com sucesso!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro no seed:', err.message);
    process.exit(1);
  }
}

seed();
