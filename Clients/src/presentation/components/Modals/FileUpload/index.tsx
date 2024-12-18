import { Box, Typography, Tooltip, Button, Stack, useTheme } from "@mui/material"
import { FC, useState } from "react"
import { uploadFile } from "../../../../application/tools/fileUtil";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "../constants";
import ErrorModal from "../Error";

/**
 * FileUpload component allows users to upload a file by either clicking a button or dragging and dropping a file.
 * It displays the uploaded file name or an error message if the upload fails.
 *
 * @component
 * @returns {JSX.Element} The rendered FileUpload component.
 */
const FileUpload: FC = () => {
  const theme = useTheme();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const { error: uploadError, file: uploadedFile } = uploadFile(
        file,
        ALLOWED_FILE_TYPES,
        MAX_FILE_SIZE
      );

      if (uploadError) {
        setError(uploadError);
        setIsErrorModalOpen(true);
      } else if (uploadedFile) {
        setFile(uploadedFile);
      }
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography sx={{ fontSize: theme.typography.fontSize, fontWeight: 500, mb: 2 }}>Upload mitigation evidence document</Typography>
      <Stack
        sx={{
          cursor: "pointer",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          border: `1px dotted ${theme.palette.border.dark}`,
          borderRadius: theme.shape.borderRadius,
          backgroundColor: theme.palette.background.main,
          width: 315,
          height: 102
        }}
      >
        <Tooltip title="Attach a file">
          <Button component="label" sx={{"&:hover": { background: "transparent" }}} disableRipple={theme.components?.MuiButton?.defaultProps?.disableRipple}>
            Click to upload
            <input
              type="file"
              hidden
              id="file-upload"
              onChange={handleFileUpload}
            />
          </Button>
        </Tooltip>
        <Typography sx={{ fontSize: 13 }}>or drag and drop</Typography>
      </Stack>
      {file 
        && <Typography variant="body2" sx={{ mt: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "315px" }}>
            Attached file: {file.name}
          </Typography>
        || <Typography sx={{ color: theme.palette.text.secondary, fontSize: theme.typography.fontSize, mt: 2 }}>Nothing selected.</Typography>
      }
      <ErrorModal
        open={isErrorModalOpen}
        errorMessage={error}
        handleClose={() => setIsErrorModalOpen(false)}
      />
    </Box>
    )
}

export default FileUpload;