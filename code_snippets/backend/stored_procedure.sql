/****** Object:  StoredProcedure [dbo].[proc_CRUD_ParticipantDiagnosis_APP]    Script Date: 4/27/2026 12:45:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[proc_CRUD_ParticipantDiagnosis_APP]
    @ID                 BIGINT          = 0,
    @ParticipantID      BIGINT          = 0,
    @ProviderID         BIGINT          = 0,
    @AssociateID        BIGINT          = 0,
    @Date               DATETIME        = NULL,
    @Inputtype          VARCHAR(50)     = '',
    @ICDCode            VARCHAR(50)     = '',
    @Description        VARCHAR(MAX)    = '',
    @type               VARCHAR(50)     = '',  -- 0=Principle,1=Primary,2=Secondary,3=Tertiary,4=Surgical (stored as Tinyint)
    @categoryId         VARCHAR(250)     = '',
    @LastUpdatedby      DECIMAL(10,0)   = 0,
    @OrderBy            VARCHAR(100)    = '',
    @PageSize           BIGINT          = 10,
    @PageNum            BIGINT          = 1,
    @Fromdate           VARCHAR(20)     = '',
    @Todate             VARCHAR(20)     = '',
    @AIInsight          NVARCHAR(MAX)   = NULL,
    @UserDiagnosis NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- =============================================
    -- Date format based on Provider Account Preference
    -- 1 = US format (MMM dd, yyyy)
    -- 2 = Metric format (dd MMM yyyy)
    -- =============================================
    DECLARE @DateFormat AS VARCHAR(50) = 'MMM dd, yyyy'
    DECLARE @DateTime   AS VARCHAR(50) = 'MMM dd, yyyy, hh:mm tt'

    IF (SELECT ISNULL(AccountPreference, 0) FROM Provider WHERE ID = @ProviderID) = 2
    BEGIN
        SET @DateFormat = 'dd MMM yyyy'
        SET @DateTime   = 'dd MMM yyyy, hh:mm tt'
    END

    -- =============================================
    -- Shared variable declarations (avoids duplicate declaration errors)
    -- =============================================
    DECLARE @DiagnosisCount     INT             = 0
    DECLARE @ResolvedCategoryId DECIMAL(10,0)   = NULL

    -- =============================================
    -- Pagination helpers
    -- =============================================
    DECLARE @First VARCHAR(50) = (@PageNum * @PageSize) - (@PageSize - 1)
    DECLARE @Last  VARCHAR(50) = (@PageNum * @PageSize)


    -- =============================================
    -- ICDLookup
    -- API Method : ICDLookup
    -- Request    : ICDCode
    -- Response   : Matching ICD code record from ICDCode10 table
    -- =============================================
    IF @Inputtype = 'ICDLookup'
    BEGIN
        SELECT *
        FROM ICDCode10
        WHERE Code = @ICDCode
    END

  
   -- =============================================
-- AddDiagnosisCode
-- =============================================
ELSE IF @Inputtype = 'AddDiagnosisCode'
BEGIN
    -- Resolve LastModifiedBy from Provider LoginID
    DECLARE @ResolvedLastModifiedByAdd DECIMAL(10,0) = 0
    SELECT @ResolvedLastModifiedByAdd = LoginID 
    FROM Provider 
    WHERE ID = @LastUpdatedby

    SELECT @DiagnosisCount = COUNT(1)
    FROM Diagnosis
    WHERE ParticipantID = @ParticipantID

    IF @DiagnosisCount = 0
        SET @type = '0'

    DECLARE @ResolvedTypeAdd TINYINT
    SET @ResolvedTypeAdd = CASE @type
        WHEN 'Principle'  THEN 0
        WHEN 'Primary'    THEN 1
        WHEN 'Secondary'  THEN 2
        WHEN 'Tertiary'   THEN 3
        WHEN 'Quaternary' THEN 4
        ELSE TRY_CAST(@type AS TINYINT)
    END

    SELECT @ResolvedCategoryId = ID
    FROM DiagnosisCategory
    WHERE Category = @categoryId

    INSERT INTO Diagnosis (
        ParticipantID, ProviderID, Date, Desciption,
        DiagnosisCategoryID, ICD10Code, [Type], LastModifiedBy, LastModifiedDT
    )
    VALUES (
        @ParticipantID, @ProviderID, @Date, @Description,
        @ResolvedCategoryId, @ICDCode,
        @ResolvedTypeAdd,
        @ResolvedLastModifiedByAdd,          -- resolved LoginID
        dbo.FngetCurrentDatetime()
    )

    SELECT SCOPE_IDENTITY() AS NewDiagnosisID
END
    --- =============================================
-- ManageDiagnosisDetails
-- =============================================
ELSE IF @Inputtype = 'ManageDiagnosisDetails'
BEGIN
    SELECT
        d.ID,
        FORMAT(d.[Date], 'MM/dd/yyyy')  AS [Date],
        d.[Type],
        CASE
            WHEN d.Type = 0 THEN 'Principle'
            WHEN d.Type = 1 THEN 'Primary'
            WHEN d.Type = 2 THEN 'Secondary'
            WHEN d.Type = 3 THEN 'Tertiary'
            WHEN d.Type = 4 THEN 'Surgical'
        END                             AS DiagnosisType,
        d.Desciption                    AS Description,
        d.DiagnosisCategoryID,
        c.Category,
        d.ICD10Code,
        d.AIINSIGHT                     AS AIInsight,
        d.UserDiagnosis,
        FORMAT(
            dbo.FngetCurrentDatetimebyzone(d.LastModifiedDT, p.ID),
            'MMM dd, yyyy, hh:mm tt'
        )                               AS LastModifiedDate,
        dbo.FnModifiedBy_DisplayName(p.ID) AS LastModifiedBy
    FROM Diagnosis d
    LEFT JOIN DiagnosisCategory c ON c.ID = d.DiagnosisCategoryID
    LEFT JOIN Provider p ON p.LoginID = d.LastModifiedBy
    WHERE
        d.ParticipantID = @ParticipantID
        AND d.ProviderID = @ProviderID
		ORDER BY d.LastModifiedDT DESC 
END


-- =============================================
-- GetIndividualDiagnosisDetails
-- =============================================
ELSE IF @Inputtype = 'GetIndividualDiagnosisDetails'
BEGIN
    SELECT
        d.ID,
        FORMAT(d.[Date], 'MM/dd/yyyy')  AS [Date],
        d.[Type],
        CASE
            WHEN d.Type = 0 THEN 'Principle'
            WHEN d.Type = 1 THEN 'Primary'
            WHEN d.Type = 2 THEN 'Secondary'
            WHEN d.Type = 3 THEN 'Tertiary'
            WHEN d.Type = 4 THEN 'Surgical'
        END                             AS DiagnosisType,
        d.Desciption                    AS Description,
        d.DiagnosisCategoryID,
        c.Category,
        d.ICD10Code,
        d.AIINSIGHT                     AS AIInsight,
        d.UserDiagnosis,
        FORMAT(
            dbo.FngetCurrentDatetimebyzone(d.LastModifiedDT, p.ID),
            'MMM dd, yyyy, hh:mm tt'
        )                               AS LastModifiedDate,
        dbo.FnModifiedBy_DisplayName(p.ID) AS LastModifiedBy
    FROM Diagnosis d
    LEFT JOIN DiagnosisCategory c ON c.ID = d.DiagnosisCategoryID
    LEFT JOIN Provider p ON p.LoginID = d.LastModifiedBy
    WHERE d.ID = @ID
END
   -- =============================================
-- UpdateDiagnosisDetails
-- =============================================
ELSE IF @Inputtype = 'UpdateDiagnosisDetails'
BEGIN
    -- Resolve LastModifiedBy from Provider LoginID
    DECLARE @ResolvedLastModifiedByUpd DECIMAL(10,0) = 0
    SELECT @ResolvedLastModifiedByUpd = LoginID 
    FROM Provider 
    WHERE ID = @LastUpdatedby

    SET @ResolvedCategoryId = NULL
    SELECT @ResolvedCategoryId = ID
    FROM DiagnosisCategory
    WHERE Category = @categoryId

    DECLARE @ResolvedType TINYINT
    SET @ResolvedType = CASE @type
        WHEN 'Principle'  THEN 0
        WHEN 'Primary'    THEN 1
        WHEN 'Secondary'  THEN 2
        WHEN 'Tertiary'   THEN 3
        WHEN 'Quaternary' THEN 4
        ELSE TRY_CAST(@type AS TINYINT)
    END

    UPDATE Diagnosis
    SET
        Date = CAST(
            CAST(CAST(@Date AS DATE) AS VARCHAR(10))
            + ' ' +
            CONVERT(VARCHAR(12), CONVERT(TIME, Date), 114)
        AS DATETIME),
        [Type]              = @ResolvedType,
        Desciption          = @Description,
        DiagnosisCategoryID = @ResolvedCategoryId,
        ICD10Code           = @ICDCode,
        AIINSIGHT           = @AIInsight,
        UserDiagnosis       = @UserDiagnosis,
        LastModifiedBy      = @ResolvedLastModifiedByUpd,   -- resolved LoginID
        LastModifiedDT      = dbo.FngetCurrentDatetime()
    WHERE ID = @ID

    SELECT @@ROWCOUNT AS RowsAffected
END
    -- =============================================
    -- DeleteDiagnosisDetails
    -- API Method : DeleteDiagnosisDetails
    -- Request    : ID
    -- =============================================
    ELSE IF @Inputtype = 'DeleteDiagnosisDetails'
    BEGIN
        DELETE FROM Diagnosis
        WHERE ID = @ID

        SELECT @@ROWCOUNT AS RowsAffected
    END

END
