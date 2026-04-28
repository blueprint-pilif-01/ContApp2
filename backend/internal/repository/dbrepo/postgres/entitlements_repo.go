package postgres

import (
	"backend/internal/models"
	"context"
)

func (r *PostgresDBRepo) ListOrganisationFeatures(ctx context.Context, organisationID int64) ([]models.OrganisationFeature, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	rows, err := r.DB.QueryContext(ctx, `
		SELECT
			ofe.organisation_id,
			ofe.feature_definition_id,
			fd.feature_key,
			ofe.enabled,
			ofe.source,
			ofe.starts_at,
			ofe.expires_at,
			ofe.config_json,
			ofe.created_at,
			ofe.updated_at
		FROM organisation_features ofe
		JOIN feature_definitions fd ON fd.id = ofe.feature_definition_id
		WHERE ofe.organisation_id = $1
		ORDER BY fd.feature_key ASC
	`, organisationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	features := make([]models.OrganisationFeature, 0)
	for rows.Next() {
		var feature models.OrganisationFeature
		if err := rows.Scan(
			&feature.OrganisationID,
			&feature.FeatureDefinitionID,
			&feature.FeatureKey,
			&feature.Enabled,
			&feature.Source,
			&feature.StartsAt,
			&feature.ExpiresAt,
			&feature.ConfigJSON,
			&feature.CreatedAt,
			&feature.UpdatedAt,
		); err != nil {
			return nil, err
		}
		features = append(features, feature)
	}
	return features, rows.Err()
}

func (r *PostgresDBRepo) ListOrganisationFeatureLimits(ctx context.Context, organisationID int64) ([]models.OrganisationFeatureLimit, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	rows, err := r.DB.QueryContext(ctx, `
		SELECT
			ofl.organisation_id,
			ofl.feature_definition_id,
			fd.feature_key,
			ofl.limit_key,
			ofl.limit_value,
			ofl.period,
			ofl.updated_at
		FROM organisation_feature_limits ofl
		JOIN feature_definitions fd ON fd.id = ofl.feature_definition_id
		WHERE ofl.organisation_id = $1
		ORDER BY fd.feature_key ASC, ofl.limit_key ASC
	`, organisationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	limits := make([]models.OrganisationFeatureLimit, 0)
	for rows.Next() {
		var limit models.OrganisationFeatureLimit
		if err := rows.Scan(
			&limit.OrganisationID,
			&limit.FeatureDefinitionID,
			&limit.FeatureKey,
			&limit.LimitKey,
			&limit.LimitValue,
			&limit.Period,
			&limit.UpdatedAt,
		); err != nil {
			return nil, err
		}
		limits = append(limits, limit)
	}
	return limits, rows.Err()
}
