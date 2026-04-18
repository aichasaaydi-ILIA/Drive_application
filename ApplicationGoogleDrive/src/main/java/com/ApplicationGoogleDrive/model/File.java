package com.ApplicationGoogleDrive.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "files")
@Data
public class File {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;
    private String fileType;
    private String filePath;
    private Long fileSize;

    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;

    private boolean isPublic = false;

    @Column(columnDefinition = "TEXT")
    private String description;

    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
    }
}
