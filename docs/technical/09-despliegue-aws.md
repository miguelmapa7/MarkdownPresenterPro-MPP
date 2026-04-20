# 9. Despliegue en AWS — Guía Detallada

## Arquitectura de Hosting

```
Usuario (navegador)
    │
    ▼
CloudFront (CDN + HTTPS + Caché)
    │
    ▼
S3 Bucket (archivos estáticos)
```

---

## Servicio 1: Amazon S3 (Simple Storage Service)

### ¿Qué es?

S3 es un servicio de almacenamiento de objetos de AWS. Piensa en él como un disco duro en la nube donde guardas archivos. Cada archivo se llama "objeto" y se organiza en "buckets" (contenedores).

### ¿Para qué lo usamos en MPP?

Almacena los archivos estáticos de la versión web: `index.html`, archivos JavaScript, CSS y assets. S3 no ejecuta código — solo almacena y sirve archivos.

### Configuración implementada:

**Crear el bucket:**

```bash
# Crear bucket S3 con nombre único globalmente
aws s3 mb s3://<TU_BUCKET_NAME> --region us-east-1
```

- `mb` = make bucket
- El nombre debe ser único en TODO AWS (no solo tu cuenta)
- `us-east-1` = región Virginia del Norte (requerida para CloudFront)

**Bloquear acceso público:**

```bash
# Bloquear todo acceso público al bucket
aws s3api put-public-access-block \
  --bucket <TU_BUCKET_NAME> \
  --public-access-block-configuration \
    BlockPublicAcls=true,\
    IgnorePublicAcls=true,\
    BlockPublicPolicy=true,\
    RestrictPublicBuckets=true
```

**Subir archivos:**

```bash
# Sincronizar archivos locales con el bucket
aws s3 sync dist-web/ s3://<TU_BUCKET_NAME> --delete
```

**Verificar contenido:**

```bash
# Listar archivos en el bucket
aws s3 ls s3://<TU_BUCKET_NAME> --recursive
```

### Costos:

- Free Tier (12 meses): 5 GB almacenamiento, 20,000 GET requests/mes
- Nuestra app: ~500 KB — 0.01% del límite

---

## Servicio 2: Amazon CloudFront (CDN)

### ¿Qué es?

CloudFront es una Red de Distribución de Contenido (CDN). Copia tus archivos en servidores distribuidos por todo el mundo. Cuando un usuario accede a tu app, CloudFront le sirve los archivos desde el servidor más cercano.

### ¿Para qué lo usamos en MPP?

- **HTTPS**: Certificado SSL gratuito
- **CDN**: Baja latencia global
- **Caché**: Reduce requests a S3
- **Compresión**: gzip/brotli automático
- **SPA routing**: Redirige errores 403/404 a `index.html`

### Configuración implementada:

**Crear distribución (desde la consola web):**

1. CloudFront → Create distribution
2. Origin: tu bucket S3
3. Origin Access Control (OAC): habilitado
4. Default root object: `index.html`
5. Compresión: habilitada

**Páginas de error para SPA:**

| Error HTTP      | Redirige a    | Código de respuesta |
| --------------- | ------------- | ------------------- |
| 403 (Forbidden) | `/index.html` | 200 (OK)            |
| 404 (Not Found) | `/index.html` | 200 (OK)            |

**Invalidar caché después de un despliegue:**

```bash
aws cloudfront create-invalidation \
  --distribution-id <TU_DISTRIBUTION_ID> \
  --paths "/index.html"
```

### URL de acceso:

Tu app web estará disponible en: `https://<ID>.cloudfront.net`
(El dominio exacto se muestra en la consola de CloudFront → Distribution domain name)

### Costos:

- Free Tier (siempre, no expira): 1 TB transferencia/mes, 10,000,000 requests/mes

---

## Servicio 3: AWS IAM (Identity and Access Management)

### ¿Qué es?

IAM gestiona quién puede hacer qué en tu cuenta de AWS. Permite crear usuarios con permisos específicos.

### Configuración implementada:

**Política de permisos (`MPP-Deploy-Policy`):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3BucketCreation",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:PutBucketPolicy",
        "s3:PutBucketPublicAccessBlock",
        "s3:GetBucketPolicy",
        "s3:GetBucketPublicAccessBlock"
      ],
      "Resource": "arn:aws:s3:::<TU_BUCKET_NAME>"
    },
    {
      "Sid": "S3DeployAccess",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::<TU_BUCKET_NAME>", "arn:aws:s3:::<TU_BUCKET_NAME>/*"]
    },
    {
      "Sid": "CloudFrontAccess",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateDistribution",
        "cloudfront:CreateOriginAccessControl",
        "cloudfront:CreateInvalidation",
        "cloudfront:GetDistribution",
        "cloudfront:UpdateDistribution"
      ],
      "Resource": "*"
    }
  ]
}
```

### Costos:

- Siempre gratis.

---

## Servicio 4: AWS Budgets (Presupuestos)

Presupuesto de "gasto cero" que envía alerta por email si cualquier cargo supera $0.01 USD. Los primeros 2 presupuestos son gratis.

---

## Proceso Completo de Despliegue

### Despliegue manual:

```bash
npm run build:web
aws s3 sync dist-web/ s3://$S3_BUCKET_NAME --delete
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/index.html"
```

### Despliegue automático (CI/CD):

Cada push a `main` ejecuta automáticamente via GitHub Actions. Secrets necesarios:

| Secret                       | Descripción                          |
| ---------------------------- | ------------------------------------ |
| `AWS_ACCESS_KEY_ID`          | Access key del usuario IAM de deploy |
| `AWS_SECRET_ACCESS_KEY`      | Secret key del usuario IAM de deploy |
| `S3_BUCKET_NAME`             | Nombre del bucket S3                 |
| `CLOUDFRONT_DISTRIBUTION_ID` | ID de la distribución CloudFront     |

---

## Seguridad

| Medida                           | Implementación                               |
| -------------------------------- | -------------------------------------------- |
| Acceso público bloqueado en S3   | `put-public-access-block` con las 4 opciones |
| Solo CloudFront accede a S3      | Origin Access Control (OAC)                  |
| HTTPS obligatorio                | Certificado CloudFront                       |
| Usuario IAM con permisos mínimos | Política `MPP-Deploy-Policy`                 |
| Alerta de costos                 | Presupuesto de gasto cero                    |
| Credenciales no en código        | GitHub Secrets para CI/CD                    |

---

## Resumen de Costos

| Servicio   | Free Tier          | Nuestro uso   | Costo  |
| ---------- | ------------------ | ------------- | ------ |
| S3         | 12 meses (5 GB)    | ~500 KB       | $0     |
| CloudFront | Siempre (1 TB)     | Mínimo        | $0     |
| IAM        | Siempre            | 1 usuario     | $0     |
| Budgets    | Siempre (2 gratis) | 1 presupuesto | $0     |
| **Total**  |                    |               | **$0** |
